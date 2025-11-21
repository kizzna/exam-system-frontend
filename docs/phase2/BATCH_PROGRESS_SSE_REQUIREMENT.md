# 📡 Batch Progress Streaming - Server-Sent Events (SSE)

**Date:** November 20, 2025  
**Priority:** HIGH  
**Impact:** Real-time progress visibility for batch uploads and processing  
**Status:** SPECIFICATION FOR BACKEND IMPLEMENTATION

---

## 🎯 Objective

Implement a **Server-Sent Events (SSE)** endpoint to provide real-time, detailed progress updates during batch upload and processing operations. This replaces the need for frontend polling and provides rich, stage-by-stage information to users.

---

## 🚨 The Problem

**Current State:**

- Frontend polls `/api/batches/{batch_id}/progress` every 2 seconds
- Limited information available:
  - Only shows: `processed_count / sheet_count` (e.g., "0 / 11404")
  - No visibility into current processing stage
  - No detailed activity messages
  - Users see "Loading progress..." for minutes with no feedback

**Backend Has Rich Information (from journal logs):**

```
18:43:18 - Chunk 1/143 uploaded (50.00MB)
18:47:14 - Extracted 11515 files from ZIP
18:47:14 - Organizing by QR codes
18:47:14 - Processing chunk 1/111: QR code 14900113
18:47:17 - Organized into 111 groups, 11404 files total
18:48:11 - Progress: 1368/11404 tasks completed (11.4s elapsed)
18:50:16 - All 11404 tasks completed in 136.6s
18:50:35 - Collected all 11404 results in 18.77s
18:51:26 - Database load completed - 11404 sheets, 1710600 answers
18:51:45 - Batch cleanup completed
```

**Gap:** This rich information exists only in journal logs - frontend has no access to it.

---

## ✅ The Solution: Server-Sent Events (SSE)

### Why SSE Over WebSocket?

| Feature            | SSE                             | WebSocket                     | Polling              |
| ------------------ | ------------------------------- | ----------------------------- | -------------------- |
| **Complexity**     | Simple (HTTP)                   | Complex (upgrade protocol)    | Simple               |
| **Direction**      | Server → Client                 | Bidirectional                 | Client → Server      |
| **Reconnection**   | Automatic                       | Manual                        | N/A                  |
| **Use Case**       | Progress updates, notifications | Chat, real-time collaboration | Fallback             |
| **Infrastructure** | None (works over HTTP/HTTPS)    | May need special proxy config | None                 |
| **Overhead**       | Low (one connection)            | Low (one connection)          | High (many requests) |

**SSE is perfect for batch progress** because:

- ✅ One-way communication (server sends updates, client receives)
- ✅ Automatic reconnection on network failure
- ✅ Works over existing HTTP infrastructure
- ✅ Simple implementation on both sides

---

## 📊 Backend API Specification

### New Endpoint: Stream Batch Progress

```http
GET /api/batches/{batch_id}/stream
Authorization: Bearer {access_token}
Accept: text/event-stream
```

**Purpose:** Real-time streaming of batch processing progress and activity logs.

**Response Format:**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: progress
data: {"stage":"uploading","message":"Chunk 1/143 uploaded (50.00MB)","progress_percentage":0.7,"sheets_total":0,"sheets_processed":0,"elapsed_seconds":0}

event: progress
data: {"stage":"uploading","message":"Chunk 143/143 uploaded (2.09MB)","progress_percentage":100,"sheets_total":0,"sheets_processed":0,"elapsed_seconds":33}

event: progress
data: {"stage":"extracting","message":"Extracting ZIP to TMPFS","progress_percentage":0,"sheets_total":0,"sheets_processed":0,"elapsed_seconds":43}

event: progress
data: {"stage":"extracting","message":"Extracted 11515 files from ZIP","progress_percentage":100,"sheets_total":11404,"sheets_processed":0,"elapsed_seconds":139}

event: progress
data: {"stage":"organizing_qr","message":"Processing chunk 1/111: QR code 14900113","progress_percentage":0.9,"sheets_total":11404,"sheets_processed":0,"elapsed_seconds":140}

event: progress
data: {"stage":"organizing_qr","message":"Processing chunk 111/111: QR code 14904523","progress_percentage":100,"sheets_total":11404,"sheets_processed":0,"elapsed_seconds":143}

event: progress
data: {"stage":"processing_sheets","message":"Dispatched 11404 tasks to workers","progress_percentage":0,"sheets_total":11404,"sheets_processed":0,"elapsed_seconds":156}

event: progress
data: {"stage":"processing_sheets","message":"Progress: 1368/11404 tasks completed","progress_percentage":12,"sheets_total":11404,"sheets_processed":1368,"elapsed_seconds":167}

event: progress
data: {"stage":"processing_sheets","message":"Progress: 5924/11404 tasks completed","progress_percentage":52,"sheets_total":11404,"sheets_processed":5924,"elapsed_seconds":223}

event: progress
data: {"stage":"processing_sheets","message":"All 11404 tasks completed","progress_percentage":100,"sheets_total":11404,"sheets_processed":11404,"elapsed_seconds":292}

event: progress
data: {"stage":"collecting_results","message":"Collecting results from Redis","progress_percentage":0,"sheets_total":11404,"sheets_processed":11404,"elapsed_seconds":292}

event: progress
data: {"stage":"collecting_results","message":"Collected all 11404 results in 18.77s","progress_percentage":100,"sheets_total":11404,"sheets_processed":11404,"elapsed_seconds":311}

event: progress
data: {"stage":"generating_csv","message":"Generating CSV files","progress_percentage":0,"sheets_total":11404,"sheets_processed":11404,"elapsed_seconds":311}

event: progress
data: {"stage":"generating_csv","message":"CSV generation complete: 11404 sheets, 1710600 answers","progress_percentage":100,"sheets_total":11404,"sheets_processed":11404,"elapsed_seconds":319}

event: progress
data: {"stage":"loading_database","message":"Loading to database via db2","progress_percentage":0,"sheets_total":11404,"sheets_processed":11404,"elapsed_seconds":319}

event: progress
data: {"stage":"loading_database","message":"Database load completed: 11404 sheets, 1710600 answers in 41638ms","progress_percentage":100,"sheets_total":11404,"sheets_processed":11404,"elapsed_seconds":362}

event: progress
data: {"stage":"cleanup","message":"Cleanup batch files","progress_percentage":0,"sheets_total":11404,"sheets_processed":11404,"elapsed_seconds":362}

event: progress
data: {"stage":"cleanup","message":"Batch cleanup completed: 111 QR covers, processing_dir=deleted, zip=archived","progress_percentage":100,"sheets_total":11404,"sheets_processed":11404,"elapsed_seconds":381}

event: complete
data: {"stage":"completed","message":"BATCH COMPLETED SUCCESSFULLY","progress_percentage":100,"sheets_total":11404,"sheets_processed":11404,"elapsed_seconds":381,"batch_id":"2905341b-226d-4c82-8c37-fbfe12afadf8"}

```

**Error Handling:**

```
event: error
data: {"stage":"failed","message":"QR code read failed: Chunk 45/111","error_details":"QR decode error: Invalid format","elapsed_seconds":142}
```

---

## 🔧 Backend Implementation Guide

### 1. Progress Event Data Model

```python
from pydantic import BaseModel
from enum import Enum

class ProcessingStage(str, Enum):
    UPLOADING = "uploading"
    EXTRACTING = "extracting"
    ORGANIZING_QR = "organizing_qr"
    PROCESSING_SHEETS = "processing_sheets"
    COLLECTING_RESULTS = "collecting_results"
    GENERATING_CSV = "generating_csv"
    LOADING_DATABASE = "loading_database"
    CLEANUP = "cleanup"
    COMPLETED = "completed"
    FAILED = "failed"

class BatchProgressEvent(BaseModel):
    stage: ProcessingStage
    message: str
    progress_percentage: float  # 0-100 within current stage
    sheets_total: int
    sheets_processed: int
    elapsed_seconds: int
    timestamp: str  # ISO 8601
    error_details: str | None = None
```

### 2. Redis Progress Storage

**Key Structure:**

```python
# Current stage and message
f"batch:{batch_id}:progress:current"
# Value: JSON of BatchProgressEvent
# TTL: 3600 seconds (1 hour)

# Activity log (list of events)
f"batch:{batch_id}:progress:log"
# Value: List of JSON events
# TTL: 3600 seconds
```

**Writing Progress Updates:**

```python
async def publish_progress(
    batch_id: str,
    stage: ProcessingStage,
    message: str,
    progress_percentage: float = 0,
    sheets_total: int = 0,
    sheets_processed: int = 0,
    error_details: str = None
):
    """Publish progress update to Redis for SSE streaming"""

    # Calculate elapsed time
    started_at = await redis.get(f"batch:{batch_id}:started_at")
    elapsed = (datetime.now() - datetime.fromisoformat(started_at)).total_seconds()

    event = BatchProgressEvent(
        stage=stage,
        message=message,
        progress_percentage=progress_percentage,
        sheets_total=sheets_total,
        sheets_processed=sheets_processed,
        elapsed_seconds=int(elapsed),
        timestamp=datetime.now().isoformat(),
        error_details=error_details
    )

    # Store current progress
    await redis.setex(
        f"batch:{batch_id}:progress:current",
        3600,
        event.json()
    )

    # Append to activity log
    await redis.rpush(
        f"batch:{batch_id}:progress:log",
        event.json()
    )
    await redis.expire(f"batch:{batch_id}:progress:log", 3600)

    # Publish to pubsub for live streaming
    await redis.publish(
        f"batch:{batch_id}:progress",
        event.json()
    )
```

**Example Usage in Existing Code:**

```python
# In chunked_upload.py
async def save_chunk(...):
    # ... existing save logic ...

    await publish_progress(
        batch_id=upload_id,
        stage=ProcessingStage.UPLOADING,
        message=f"Chunk {chunk_index + 1}/{total_chunks} uploaded ({chunk_size_mb}MB)",
        progress_percentage=(chunk_index + 1) / total_chunks * 100
    )

# In qr_organizer.py
async def organize_by_qr(...):
    await publish_progress(
        batch_id=batch_id,
        stage=ProcessingStage.ORGANIZING_QR,
        message=f"Processing chunk {i}/{total_chunks}: QR code {qr_code}",
        progress_percentage=i / total_chunks * 100,
        sheets_total=total_files
    )

# In batch_processor.py (worker progress)
async def monitor_workers(...):
    while not all_complete:
        completed = await get_completed_count()
        await publish_progress(
            batch_id=batch_id,
            stage=ProcessingStage.PROCESSING_SHEETS,
            message=f"Progress: {completed}/{total} tasks completed",
            progress_percentage=completed / total * 100,
            sheets_total=total,
            sheets_processed=completed,
            elapsed_seconds=elapsed
        )
        await asyncio.sleep(5)  # Update every 5 seconds
```

### 3. SSE Endpoint Implementation

```python
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

router = APIRouter()

@router.get("/batches/{batch_id}/stream")
async def stream_batch_progress(
    batch_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Stream real-time batch processing progress via Server-Sent Events.

    Client should listen for 'progress', 'complete', and 'error' events.
    Connection auto-closes when batch reaches 'completed' or 'failed' state.
    """

    # Verify batch exists and user has access
    batch = await get_batch(batch_id)
    if not batch:
        raise HTTPException(404, "Batch not found")

    # Check permissions
    if not current_user.is_admin and batch.uploaded_by != current_user.user_id:
        raise HTTPException(403, "Access denied")

    async def event_generator():
        """Generate SSE events from Redis pubsub"""

        # Subscribe to progress updates
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"batch:{batch_id}:progress")

        # Send existing progress log first (for reconnections)
        existing_log = await redis.lrange(f"batch:{batch_id}:progress:log", 0, -1)
        for event_json in existing_log:
            event = json.loads(event_json)
            yield {
                "event": "progress",
                "data": json.dumps(event)
            }

        # Stream new events
        try:
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue

                event_data = json.loads(message["data"])

                # Determine event type
                if event_data["stage"] == "completed":
                    yield {
                        "event": "complete",
                        "data": json.dumps(event_data)
                    }
                    break  # Close connection
                elif event_data["stage"] == "failed":
                    yield {
                        "event": "error",
                        "data": json.dumps(event_data)
                    }
                    break  # Close connection
                else:
                    yield {
                        "event": "progress",
                        "data": json.dumps(event_data)
                    }
        finally:
            await pubsub.unsubscribe(f"batch:{batch_id}:progress")
            await pubsub.close()

    return EventSourceResponse(event_generator())
```

### 4. Dependencies

```bash
# requirements.txt
sse-starlette==1.6.5  # SSE support for FastAPI
```

---

## 🧪 Testing

### Manual Testing with curl

```bash
# Get auth token
TOKEN=$(curl -s -X POST "http://gt-omr-api-1:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" | jq -r .access_token)

# Stream batch progress
curl -N -H "Authorization: Bearer $TOKEN" \
  "http://gt-omr-api-1:8000/api/batches/{batch_id}/stream"
```

**Expected Output:**

```
event: progress
data: {"stage":"uploading","message":"Chunk 1/143 uploaded (50.00MB)",...}

event: progress
data: {"stage":"extracting","message":"Extracting ZIP to TMPFS",...}

event: progress
data: {"stage":"organizing_qr","message":"Processing chunk 1/111",...}

event: complete
data: {"stage":"completed","message":"BATCH COMPLETED SUCCESSFULLY",...}
```

### Frontend Testing

```typescript
const eventSource = new EventSource(`${API_URL}/api/batches/${batchId}/stream`, {
  headers: { Authorization: `Bearer ${token}` },
});

eventSource.addEventListener('progress', (event) => {
  const data = JSON.parse(event.data);
  console.log(`[${data.stage}] ${data.message} - ${data.progress_percentage}%`);
});

eventSource.addEventListener('complete', (event) => {
  console.log('Batch completed!', JSON.parse(event.data));
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  console.error('Batch failed:', JSON.parse(event.data));
  eventSource.close();
});
```

---

## 📋 Implementation Checklist

### Phase 1: Core SSE Infrastructure (Week 1)

- [ ] Add `sse-starlette` dependency
- [ ] Create `BatchProgressEvent` data model
- [ ] Implement `publish_progress()` helper function
- [ ] Create Redis pubsub channel: `batch:{batch_id}:progress`
- [ ] Implement `/api/batches/{batch_id}/stream` endpoint
- [ ] Test SSE connection with curl
- [ ] Test SSE reconnection on network interruption

### Phase 2: Integrate Progress Publishing (Week 1-2)

- [ ] **Chunked Upload Progress**
  - Publish on each chunk received
  - Publish on reassembly start
  - Publish on reassembly complete
- [ ] **ZIP Extraction Progress**
  - Publish on extraction start
  - Publish on extraction complete
- [ ] **QR Organization Progress**
  - Publish on each QR chunk processed
  - Publish on organization complete
- [ ] **Worker Processing Progress**
  - Publish every 5 seconds with task completion count
  - Publish on all tasks complete
- [ ] **Database Loading Progress**
  - Publish on CSV generation start/complete
  - Publish on database load start/complete
- [ ] **Cleanup Progress**
  - Publish on cleanup start/complete

### Phase 3: Error Handling & Edge Cases (Week 2)

- [ ] Publish error events on failures
- [ ] Handle client disconnection
- [ ] Handle batch not found
- [ ] Handle unauthorized access
- [ ] Test with very long-running batches (>1 hour)
- [ ] Test with multiple concurrent clients streaming same batch

### Phase 4: Frontend Integration (Week 2)

- [ ] Frontend creates SSE connection after upload
- [ ] Frontend displays live progress log
- [ ] Frontend handles reconnection
- [ ] Frontend closes connection on completion
- [ ] Frontend shows detailed stage information

---

## 🎯 Success Criteria

**Backend:**

- ✅ SSE endpoint responds with `text/event-stream`
- ✅ Events published at all major processing stages
- ✅ Clients can reconnect and receive missed events
- ✅ Connection closes automatically on completion/failure
- ✅ Multiple clients can stream same batch simultaneously
- ✅ No performance degradation during streaming

**Frontend:**

- ✅ Live progress log displays during upload/processing
- ✅ Users see detailed stage-by-stage progress
- ✅ Reconnection works seamlessly
- ✅ No polling of `/api/batches/{batch_id}/progress` needed during active processing

---

## 📊 Performance Considerations

### Redis Pubsub Scalability

- **Current Load:** ~10-20 concurrent batches
- **Pubsub Channels:** 1 per batch = 10-20 channels
- **Message Rate:** ~1-5 events/second per batch = 10-100 msg/sec total
- **Redis Capacity:** Can handle 100,000+ msg/sec → **No concern**

### Connection Management

- **SSE Connections:** 1 per user per batch
- **Expected:** 5-10 concurrent users watching batches
- **Server Capacity:** Nginx/Uvicorn can handle 1000+ concurrent SSE connections → **No concern**

### Memory Usage

- **Redis Storage:** ~1-2 KB per event × 100 events per batch × 20 batches = 2-4 MB
- **TTL:** 1 hour → Auto-cleanup
- **Impact:** Negligible

---

## 🔍 Monitoring & Debugging

### Redis Commands for Debugging

```bash
# Check current progress
redis-cli GET "batch:{batch_id}:progress:current"

# View activity log
redis-cli LRANGE "batch:{batch_id}:progress:log" 0 -1

# Monitor pubsub messages
redis-cli PSUBSCRIBE "batch:*:progress"

# Check active SSE clients
redis-cli PUBSUB NUMSUB "batch:{batch_id}:progress"
```

### API Logs

```bash
# Watch SSE endpoint activity
sudo journalctl -u omr-api.service -f | grep "stream"
```

---

## 🚀 Deployment

### No Infrastructure Changes Needed

- ✅ Works over existing HTTP/HTTPS
- ✅ No WebSocket configuration needed
- ✅ No nginx special configuration (SSE works like regular HTTP)
- ✅ No firewall changes

### Rollout Strategy

1. Deploy backend with SSE endpoint (backward compatible)
2. Test SSE with curl and browser
3. Deploy frontend with SSE integration
4. Monitor for 1 week
5. Deprecate polling-only approach (keep as fallback)

---

## 📞 Questions & Support

**For Backend Team:**

- SSE implementation examples: https://github.com/sysid/sse-starlette
- FastAPI SSE guide: https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse
- Redis Pubsub: https://redis.io/docs/manual/pubsub/

**Contact:**

- Frontend Lead: [Your contact]
- Backend Lead: [Backend contact]
- DevOps: [DevOps contact]

---

## ✅ Acceptance Criteria

**This feature is complete when:**

1. Backend publishes progress events to Redis at all major stages
2. SSE endpoint `/api/batches/{batch_id}/stream` returns live events
3. Frontend displays real-time progress log
4. Users can see detailed stage information instead of "Loading progress..."
5. No polling needed during active batch processing
6. Reconnection works after network interruptions
7. Multiple users can watch same batch simultaneously

---

**Priority:** HIGH  
**Estimated Effort:** 2-3 days backend + 1 day frontend  
**Impact:** Significantly improved UX for batch uploads

**Let's bring the rich backend processing logs to the frontend! 🚀**
