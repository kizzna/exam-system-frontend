"""
Batches API Router - Phase 2

Provides clean, domain-driven, authenticated endpoints for batch operations.
Wraps existing proven jobs.py functionality with better API structure.
"""

import asyncio
import json
import logging
import os
from typing import List, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
)
from sse_starlette.sse import EventSourceResponse

from src.api.dependencies import Settings, get_db, get_redis, get_settings
from src.api.models.responses import (
    BatchProgressEvent,
    ChunkUploadResponse,
    JobStatusResponse,
    JobSubmitResponse,
    ProcessingStage,
)
from src.api.services.chunked_upload import ChunkedUploadService, ChunkMetadata
from src.api.services.progress_publisher import ProgressPublisher
from src.domains.auth.dependencies import get_current_user
from src.domains.users.models import User
from src.services.base_database_service import BaseDatabaseService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/batches", tags=["Batches"])

# Initialize chunked upload service
_chunked_upload_service = ChunkedUploadService()


@router.post("/upload", response_model=JobSubmitResponse, status_code=202)
async def upload_batch(
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None, description="ZIP file"),
    files: Optional[List[UploadFile]] = File(None, description="Image files"),
    user_id: Optional[str] = Form(None, description="User identifier"),
    task_id: Optional[str] = Form(
        None, description="8-digit task_id (e.g., '11600111') for non-QR uploads"),
    has_qr: bool = Form(
        True, description="Whether ZIP contains QR code sheets"),
    notes: Optional[str] = Form(None, description="Additional notes"),
    current_user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    redis_client=Depends(get_redis),
    db: BaseDatabaseService = Depends(get_db)
) -> JobSubmitResponse:
    """
    Unified batch upload endpoint (authenticated)

    Supports three upload strategies:
    1. ZIP with QR codes - QR code read from first sheet
    2. ZIP without QR - requires 8-digit task_id
    3. Image files - requires 8-digit task_id

    The system automatically selects the optimal processing strategy.
    """
    # Reuse the existing proven submit_unified from jobs.py
    from src.api.routers.jobs import submit_unified

    # Override user_id with authenticated user
    effective_user_id = user_id or str(current_user.user_id)

    logger.info(
        f"Batch upload requested by user {current_user.username} (ID: {current_user.user_id})")

    return await submit_unified(
        background_tasks=background_tasks,
        file=file,
        files=files,
        user_id=effective_user_id,
        task_id=task_id,
        has_qr=has_qr,
        notes=notes,
        settings=settings,
        redis_client=redis_client,
        db=db
    )


@router.post("/upload-chunk", response_model=ChunkUploadResponse, status_code=202)
async def upload_chunk(
    background_tasks: BackgroundTasks,
    chunk: UploadFile = File(..., description="File chunk (max 100MB)"),
    chunk_index: int = Form(..., description="0-based chunk index"),
    total_chunks: int = Form(..., description="Total number of chunks"),
    filename: str = Form(..., description="Original filename"),
    upload_type: str = Form(...,
                            description="Upload type: zip_with_qr, zip_no_qr, images"),
    upload_id: Optional[str] = Form(
        None, description="Upload ID (from first chunk response)"),
    task_id: Optional[str] = Form(
        None, description="8-digit task_id for non-QR uploads"),
    is_final_chunk: bool = Form(
        False, description="True if this is the last chunk"),
    current_user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    redis_client=Depends(get_redis),
    db: BaseDatabaseService = Depends(get_db)
) -> ChunkUploadResponse:
    """
    Upload a file chunk (for files > 100MB)

    This endpoint handles chunked uploads to work around Cloudflare's 100MB
    request size limit. Files are split into chunks on the client, uploaded
    sequentially, and reassembled on the server.

    Flow:
    1. Upload chunk 0 → Receive upload_id
    2. Upload chunks 1..N-1 → Track progress
    3. Upload final chunk (is_final_chunk=true) → Triggers batch creation

    Args:
        chunk: File chunk data (max 100MB)
        chunk_index: Zero-based index of this chunk
        total_chunks: Total number of chunks in upload
        filename: Original filename
        upload_type: 'zip_with_qr', 'zip_no_qr', or 'images'
        upload_id: Upload identifier (required for chunks > 0)
        task_id: 8-digit task ID (required for zip_no_qr and images)
        is_final_chunk: True for the last chunk

    Returns:
        ChunkUploadResponse with upload status and batch_id (if complete)
    """
    logger.info(
        f"Chunk upload: chunk {chunk_index + 1}/{total_chunks} by user {current_user.username}"
    )

    # Validate upload_type
    valid_upload_types = ['zip_with_qr', 'zip_no_qr', 'images']
    if upload_type not in valid_upload_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid upload_type. Must be one of: {', '.join(valid_upload_types)}"
        )

    # Validate task_id for non-QR uploads
    if upload_type in ['zip_no_qr', 'images'] and not task_id:
        raise HTTPException(
            status_code=400,
            detail=f"task_id required for upload_type '{upload_type}'"
        )

    # Get chunk size
    chunk.file.seek(0, 2)  # Seek to end
    chunk_size = chunk.file.tell()
    chunk.file.seek(0)  # Reset to beginning

    # Process chunk
    metadata = ChunkMetadata(
        upload_id=upload_id or "",
        chunk_index=chunk_index,
        total_chunks=total_chunks,
        filename=filename,
        upload_type=upload_type,
        task_id=task_id,
        is_final_chunk=is_final_chunk,
        chunk_size=chunk_size
    )

    result = await _chunked_upload_service.process_chunk(chunk, metadata)

    # Publish progress update (using upload_id as temporary batch_id)
    try:
        import redis.asyncio as aioredis

        # Create async Redis client with password
        redis_url = (
            f"redis://:{settings.redis_password}@"
            f"{settings.redis_host}:{settings.redis_port}/{settings.redis_db}"
        )
        async_redis = aioredis.from_url(redis_url, decode_responses=True)

        publisher = ProgressPublisher(async_redis)

        # Publish chunk upload progress
        chunk_size_mb = chunk_size / (1024 * 1024)
        progress_pct = (chunk_index + 1) / total_chunks * 100

        await publisher.publish_progress(
            batch_id=result.upload_id,
            stage=ProcessingStage.UPLOADING,
            message=f"Chunk {chunk_index + 1}/{total_chunks} uploaded ({chunk_size_mb:.2f}MB)",
            progress_percentage=progress_pct
        )

        await async_redis.close()
    except Exception as e:
        logger.warning(f"Failed to publish chunk upload progress: {e}")

    # If upload is complete, trigger batch processing
    if result.is_complete and result.reassembled_path:
        logger.info(
            f"Upload {result.upload_id}: All chunks received, triggering batch processing"
        )

        try:
            # Import here to avoid circular imports
            import aiofiles
            from fastapi import UploadFile as FUF

            from src.api.routers.jobs import submit_unified

            # Create UploadFile from reassembled file
            async with aiofiles.open(result.reassembled_path, 'rb') as f:
                file_content = await f.read()

            # Determine file/files parameter based on upload_type
            if upload_type == 'images':
                # For images, we need to handle multiple files
                # But since we reassembled into one file, this is a ZIP of images
                # Convert to images upload format
                reassembled_file = FUF(
                    filename=filename,
                    file=open(result.reassembled_path, 'rb')
                )
                files = [reassembled_file]
                file = None
            else:
                # ZIP upload (with or without QR)
                reassembled_file = FUF(
                    filename=filename,
                    file=open(result.reassembled_path, 'rb')
                )
                file = reassembled_file
                files = None

            # Submit batch for processing
            has_qr = (upload_type == 'zip_with_qr')

            batch_response = await submit_unified(
                background_tasks=background_tasks,
                file=file,
                files=files,
                user_id=str(current_user.user_id),
                task_id=task_id,
                has_qr=has_qr,
                notes=f"Chunked upload ({total_chunks} chunks)",
                settings=settings,
                redis_client=redis_client,
                db=db
            )

            # Clean up temp files in background
            def cleanup():
                try:
                    if file:
                        file.file.close()
                    if files:
                        for f in files:
                            f.file.close()
                    _chunked_upload_service.cleanup_upload(result.upload_id)
                except Exception as e:
                    logger.error(
                        f"Cleanup failed for upload {result.upload_id}: {e}")

            background_tasks.add_task(cleanup)

            return ChunkUploadResponse(
                upload_id=result.upload_id,
                chunk_index=result.chunk_index,
                chunks_received=result.chunks_received,
                total_chunks=result.total_chunks,
                is_complete=True,
                batch_id=batch_response.batch_id,
                status=batch_response.status,
                message=batch_response.message
            )

        except Exception as e:
            logger.error(
                f"Batch creation failed for upload {result.upload_id}: {e}", exc_info=True)
            # Clean up on error
            _chunked_upload_service.cleanup_upload(result.upload_id)
            raise HTTPException(
                status_code=500,
                detail=f"Batch creation failed: {str(e)}"
            )

    # Chunk received but upload not yet complete
    return ChunkUploadResponse(
        upload_id=result.upload_id,
        chunk_index=result.chunk_index,
        chunks_received=result.chunks_received,
        total_chunks=result.total_chunks,
        is_complete=False,
        message=f"Chunk {chunk_index + 1}/{total_chunks} received"
    )


@router.get("/{batch_id}/status", response_model=JobStatusResponse)
async def get_batch_status(
    batch_id: str,
    include_sheets: bool = Query(False, description="Include sheet details"),
    limit: int = Query(100, ge=1, le=1000, description="Max sheets to return"),
    current_user: User = Depends(get_current_user),
    db: BaseDatabaseService = Depends(get_db),
    redis_client=Depends(get_redis),
    settings: Settings = Depends(get_settings)
) -> JobStatusResponse:
    """
    Get detailed batch status and progress

    Returns current processing status, progress percentage, and optionally
    individual sheet statuses.
    """
    from src.api.routers.jobs import get_job_status
    return await get_job_status(
        batch_id=batch_id,
        include_sheets=include_sheets,
        limit=limit,
        db=db,
        redis_client=redis_client,
        settings=settings
    )


@router.get("/{batch_id}/stream")
async def stream_batch_progress(
    batch_id: str,
    current_user: User = Depends(get_current_user),
    db: BaseDatabaseService = Depends(get_db),
    redis_client=Depends(get_redis)
):
    """
    Stream real-time batch processing progress via Server-Sent Events (SSE)

    This endpoint provides live progress updates during batch upload and processing.
    Client should listen for 'progress', 'complete', and 'error' events.
    Connection auto-closes when batch reaches 'completed' or 'failed' state.

    Event Types:
    - 'progress': Regular progress update
    - 'complete': Batch completed successfully
    - 'error': Batch failed

    Example (JavaScript):
        const eventSource = new EventSource('/api/batches/{batch_id}/stream');
        eventSource.addEventListener('progress', (e) => {
            const data = JSON.parse(e.data);
            console.log(data.message, data.progress_percentage);
        });
    """
    # Verify batch exists
    query = """
        SELECT batch_uuid, uploaded_by
        FROM omr_batches
        WHERE batch_uuid = %s
    """
    result = db.execute_query(query, (batch_id,), fetch_one=True)

    if not result:
        raise HTTPException(404, f"Batch {batch_id} not found")

    # Check permissions
    if not current_user.is_admin and result.get('uploaded_by') != current_user.user_id:
        raise HTTPException(403, "Access denied")

    async def event_generator():
        """Generate SSE events from Redis pubsub"""

        import redis.asyncio as aioredis

        from src.api.dependencies import get_settings

        # Create async Redis client for pubsub with password
        settings_local = get_settings()
        redis_url = (
            f"redis://:{settings_local.redis_password}@"
            f"{settings_local.redis_host}:{settings_local.redis_port}/{settings_local.redis_db}"
        )
        async_redis = aioredis.from_url(redis_url, decode_responses=True)

        publisher = ProgressPublisher(async_redis)

        try:
            # Send existing progress log first (for reconnections)
            existing_log = await publisher.get_progress_log(batch_id, limit=1000)

            for event in existing_log:
                event_type = "progress"
                if event.stage == ProcessingStage.COMPLETED:
                    event_type = "complete"
                elif event.stage == ProcessingStage.FAILED:
                    event_type = "error"

                yield {
                    "event": event_type,
                    "data": event.model_dump_json()
                }

                # If already completed/failed, close connection
                if event_type in ["complete", "error"]:
                    await async_redis.close()
                    return

            # Subscribe to live progress updates
            pubsub = async_redis.pubsub()
            await pubsub.subscribe(f"batch:{batch_id}:progress")

            # Stream new events
            logger.info(
                f"SSE stream started for batch {batch_id} by user {current_user.username}")

            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue

                try:
                    event_data = json.loads(message["data"])
                    event = BatchProgressEvent.model_validate(event_data)

                    # Determine event type
                    event_type = "progress"
                    if event.stage == ProcessingStage.COMPLETED:
                        event_type = "complete"
                    elif event.stage == ProcessingStage.FAILED:
                        event_type = "error"

                    yield {
                        "event": event_type,
                        "data": event.model_dump_json()
                    }

                    # Close connection on completion/failure
                    if event_type in ["complete", "error"]:
                        logger.info(
                            f"SSE stream ended for batch {batch_id}: {event_type}")
                        break

                except Exception as e:
                    logger.error(
                        f"Error processing SSE event: {e}", exc_info=True)
                    continue

        except asyncio.CancelledError:
            logger.info(f"SSE stream cancelled for batch {batch_id}")
            raise
        except Exception as e:
            logger.error(
                f"SSE stream error for batch {batch_id}: {e}", exc_info=True)
            # Send error event
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }
        finally:
            try:
                await pubsub.unsubscribe(f"batch:{batch_id}:progress")
                await pubsub.close()
                await async_redis.close()
            except Exception as e:
                logger.error(f"Error closing SSE stream: {e}")

    return EventSourceResponse(event_generator())


@router.get("/{batch_id}/progress")
async def get_batch_progress(
    batch_id: str,
    current_user: User = Depends(get_current_user),
    db: BaseDatabaseService = Depends(get_db)
) -> dict:
    """
    Get simplified batch progress (lightweight polling endpoint)

    Returns progress percentage and counts without full details.
    Ideal for real-time progress bars in frontend.
    """
    query = """
        SELECT 
            b.batch_uuid,
            b.id as batch_int_id,
            b.processing_status as status,
            b.sheet_count,
            b.uploaded_at,
            b.processing_completed_at
        FROM omr_batches b
        WHERE b.batch_uuid = %s
    """

    result = db.execute_query(query, (batch_id,), fetch_one=True)

    if not result:
        raise HTTPException(
            status_code=404, detail=f"Batch {batch_id} not found")

    # Get processed count from sheets using integer batch_id
    sheets_query = """
        SELECT 
            COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as processed_count,
            COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed_count
        FROM omr_sheets
        WHERE batch_id = %s
    """

    sheets_result = db.execute_query(
        sheets_query, (result['batch_int_id'],), fetch_one=True)

    processed_count = sheets_result.get(
        'processed_count', 0) if sheets_result else 0
    failed_count = sheets_result.get('failed_count', 0) if sheets_result else 0
    sheet_count = result.get('sheet_count', 0)

    progress_percentage = (processed_count / sheet_count *
                           100) if sheet_count > 0 else 0

    return {
        "batch_uuid": result['batch_uuid'],
        "status": result['status'],
        "sheet_count": sheet_count,
        "processed_count": processed_count,
        "failed_count": failed_count,
        "progress_percentage": round(progress_percentage, 2),
        "created_at": result['uploaded_at'].isoformat() if result.get('uploaded_at') else None,
        "completed_at": result['processing_completed_at'].isoformat() if result.get('processing_completed_at') else None
    }


@router.get("/", response_model=dict)
async def list_batches(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: User = Depends(get_current_user),
    db: BaseDatabaseService = Depends(get_db)
) -> dict:
    """
    List batches for current user (paginated)

    Filters:
    - status: Filter by processing status (uploaded, validating, processing, completed, failed)
    - limit: Results per page (1-100)
    - offset: Pagination offset
    """
    # Build query
    query = """
        SELECT 
            id,
            batch_uuid,
            upload_filename as batch_name,
            upload_type,
            processing_status as status,
            sheet_count,
            file_size_bytes,
            uploaded_at as created_at,
            processing_started_at,
            processing_completed_at,
            error_message,
            description as notes
        FROM omr_batches
        WHERE 1=1
    """

    params = []

    # Filter by user unless admin
    if not current_user.is_admin:
        query += " AND uploaded_by = %s"
        params.append(current_user.user_id)

    # Filter by status if provided
    if status:
        query += " AND processing_status = %s"
        params.append(status)

    # Count total
    count_query = "SELECT COUNT(*) as total FROM omr_batches WHERE 1=1"
    if not current_user.is_admin:
        count_query += " AND uploaded_by = %s"
    if status:
        count_query += " AND processing_status = %s"

    total_result = db.execute_query(count_query, tuple(params), fetch_one=True)
    total = total_result.get('total', 0) if total_result else 0

    # Add pagination
    query += " ORDER BY uploaded_at DESC LIMIT %s OFFSET %s"
    params.extend([limit, offset])

    batches_result = db.execute_query(query, tuple(params), fetch_all=True)
    batches = batches_result if batches_result else []

    # Format response
    batch_list = []
    for batch in batches:
        batch_list.append({
            "batch_id": batch['id'],
            "batch_uuid": batch['batch_uuid'],
            "batch_name": batch['batch_name'],
            "upload_type": batch['upload_type'],
            "status": batch['status'],
            "sheet_count": batch['sheet_count'],
            "file_size_bytes": batch['file_size_bytes'],
            "created_at": batch['created_at'].isoformat() if batch.get('created_at') else None,
            "processing_started_at": batch['processing_started_at'].isoformat() if batch.get('processing_started_at') else None,
            "completed_at": batch['processing_completed_at'].isoformat() if batch.get('processing_completed_at') else None,
            "error_message": batch.get('error_message'),
            "notes": batch.get('notes')
        })

    return {
        "batches": batch_list,
        "total": total,
        "limit": limit,
        "offset": offset,
        "showing": len(batch_list)
    }


@router.delete("/{batch_id}", status_code=204)
async def delete_batch(
    batch_id: str,
    current_user: User = Depends(get_current_user),
    db: BaseDatabaseService = Depends(get_db)
):
    """
    Delete a batch (Admin only)

    Simple hard delete for cleanup purposes.
    Future enhancement: Add soft delete with audit trail.
    """
    # Admin-only endpoint
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can delete batches"
        )

    # Check batch exists
    check_query = """
        SELECT id FROM omr_batches WHERE batch_uuid = %s
    """

    result = db.execute_query(check_query, (batch_id,), fetch_one=True)

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Batch {batch_id} not found"
        )

    # Hard delete
    delete_query = """
        DELETE FROM omr_batches WHERE batch_uuid = %s
    """

    db.execute_query(delete_query, (batch_id,),
                     fetch_one=False, fetch_all=False)

    logger.info(f"Batch {batch_id} deleted by admin {current_user.username}")

    return None
