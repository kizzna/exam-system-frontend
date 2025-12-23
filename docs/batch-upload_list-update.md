# update batch upload list page

## Request URL
http://omr.gt/api/batches?page_size=50&offset=0
Request Method
GET
Response:
{
    "batches": [
        {
            "batch_id": 11255,
            "batch_uuid": "aa3dd379-c853-4eb1-be49-efe632af90fc",
            "batch_name": "207-6.zip",
            "upload_type": "zip_qr",
            "status": "failed",
            "sheet_count": 0,
            "file_size_bytes": 0,
            "created_at": "2025-12-23T19:15:04",
            "processing_started_at": "2025-12-23T19:15:07",
            "completed_at": "2025-12-23T19:15:07",
            "error_message": "Batch processing failed: No sheets were created",
            "notes": null,
            "username": "ภาค2-3"
        },
        /* ... */
    ],
    "total": 317,
    "limit": 50,
    "offset": 0,
    "showing": 50
}

## Current filters: 
- BatchStatus: completed / failed dropdown

## New additional filters: 
- username (input text)
- batch_name (input text)