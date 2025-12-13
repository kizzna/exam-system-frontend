# Update report for batch upload for failed cases

API Server log:
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,019 - src.api.main - INFO - → OPTIONS /api/batches/upload
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,019 - src.api.main - INFO - ← OPTIONS /api/batches/upload - Status: 200
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,029 - src.api.main - INFO - → POST /api/batches/upload
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,207 - src.api.routers.batches - INFO - Batch upload requested by user admin (ID: 1)
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,207 - src.api.routers.jobs - INFO - Upload request - Strategy: ZipWithQRStrategy, User: 1, Files: 1
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,209 - src.api.services.batch_processor - INFO - Created batch record: 96b2617f-4955-422b-9801-411759d876e6 (id=10675)
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,209 - src.api.routers.jobs - INFO - Batch 96b2617f-4955-422b-9801-411759d876e6: Created with upload_type='zip_qr'
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,254 - src.api.routers.jobs - INFO - Batch 96b2617f-4955-422b-9801-411759d876e6: Saved ZIP file (35.2 MB)
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,262 - src.api.main - INFO - ← POST /api/batches/upload - Status: 202
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,268 - src.api.services.upload_strategies - INFO - Batch 96b2617f-4955-422b-9801-411759d876e6: Extracting ZIP to TMPFS
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,268 - src.api.services.file_handler - INFO - Using ripunzip for extraction: /home/ubuntu/.cargo/bin/ripunzip
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,312 - src.api.services.file_handler - INFO - Extracted 53 files from /dev/shm/omr/uploads/96b2617f-4955-422b-9801-411759d876e6/117.zip to /dev/shm/omr/processing/96b2617f-4955-422b-9801-411759d876e6 in 0.04s
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,313 - src.api.services.file_handler - INFO - Found 53 image files in /dev/shm/omr/processing/96b2617f-4955-422b-9801-411759d876e6
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,313 - src.api.services.upload_strategies - INFO - Batch 96b2617f-4955-422b-9801-411759d876e6: Extracted 53 files
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,313 - src.api.services.task_permission_validator - INFO - Validating QR permissions for user_id=1 in /dev/shm/omr/processing/96b2617f-4955-422b-9801-411759d876e6
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,313 - src.api.services.task_permission_validator - INFO - Scanning QR codes from /dev/shm/omr/processing/96b2617f-4955-422b-9801-411759d876e6
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,314 - src.api.services.task_permission_validator - INFO - Found 2 potential QR cover files
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,340 - src.api.services.task_permission_validator - INFO - Found QR code 11700111 in 117-00001.jpg
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,366 - src.api.services.task_permission_validator - INFO - Found QR code 11700121 in 117-00065.jpg
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,366 - src.api.services.task_permission_validator - INFO - Scanned 2 unique QR codes from 2 cover files
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,367 - src.api.services.task_permission_validator - INFO - QR Scan Performance: 2 codes found in 0.05s
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,369 - src.api.services.task_permission_validator - INFO - User 1 is admin - granting access to all 2 tasks
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,369 - src.api.services.task_permission_validator - INFO - Permission Check Performance: Checked 2 tasks in 0.00s
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,370 - src.api.services.task_permission_validator - INFO - Found 2 tasks that already have sheets: 11700111, 11700121
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,370 - src.api.services.task_permission_validator - INFO - ✓ Permission validation passed: All 2 tasks are assigned to user 1
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,370 - src.api.services.upload_strategies - INFO - Batch 96b2617f-4955-422b-9801-411759d876e6: Skipping 2 duplicate tasks: 11700111, 11700121
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,371 - src.api.services.upload_strategies - INFO - Batch 96b2617f-4955-422b-9801-411759d876e6: Organizing by QR codes
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,371 - src.api.services.qr_organizer - INFO - Starting QR organization in /dev/shm/omr/processing/96b2617f-4955-422b-9801-411759d876e6
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,372 - src.api.services.qr_organizer - INFO - Found 53 files to organize
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,372 - src.api.services.qr_organizer - INFO - Detected 2 potential QR cover sheets
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,372 - src.api.services.qr_organizer - INFO - Processing chunk 1/2: 32 files starting with 117-00001.jpg
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,398 - src.api.services.qr_organizer - INFO - Skipping duplicate task 11700111 - files will not be moved
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,398 - src.api.services.qr_organizer - INFO - Processing chunk 2/2: 21 files starting with 117-00065.jpg
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,423 - src.api.services.qr_organizer - INFO - Skipping duplicate task 11700121 - files will not be moved
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,423 - src.api.services.qr_organizer - INFO - QR organization complete: 0 groups created, 0 errors
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,423 - src.api.services.upload_strategies - INFO - Batch 96b2617f-4955-422b-9801-411759d876e6: No QR groups created
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,423 - src.api.services.upload_strategies - INFO - Batch 96b2617f-4955-422b-9801-411759d876e6: All tasks were duplicates, skipping processing
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,423 - src.api.services.upload_strategies - INFO - Batch 96b2617f-4955-422b-9801-411759d876e6: Moving files to CephFS
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,468 - src.api.services.upload_strategies - INFO - Batch 96b2617f-4955-422b-9801-411759d876e6: Moved 0 files to CephFS
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,468 - src.api.routers.jobs - INFO - Batch 96b2617f-4955-422b-9801-411759d876e6: Strategy ZipWithQRStrategy extracted 0 sheets
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,468 - src.api.main - INFO - → OPTIONS /api/batches/96b2617f-4955-422b-9801-411759d876e6/progress
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,469 - src.api.main - INFO - ← OPTIONS /api/batches/96b2617f-4955-422b-9801-411759d876e6/progress - Status: 200
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,472 - src.api.services.batch_processor - INFO - Updated batch status to: processing
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,472 - src.api.main - INFO - → GET /api/batches/96b2617f-4955-422b-9801-411759d876e6/progress
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,480 - src.api.services.batch_processor - INFO - Created 0 sheet records for batch 96b2617f-4955-422b-9801-411759d876e6
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,480 - src.api.routers.jobs - ERROR - Batch 96b2617f-4955-422b-9801-411759d876e6: Batch processing failed: No sheets were created
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,481 - src.api.routers.jobs - ERROR - No sheets were created
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: Traceback (most recent call last):
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]:   File "/cephfs/omr/releases/dev-20251212_151610/src/api/routers/jobs.py", line 212, in _process_with_strategy
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]:     raise BatchProcessingError("No sheets were created")
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: src.api.services.batch_processor.BatchProcessingError: No sheets were created
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,484 - src.api.main - INFO - ← GET /api/batches/96b2617f-4955-422b-9801-411759d876e6/progress - Status: 200
Dec 13 07:32:35 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:35,487 - src.api.services.batch_processor - INFO - Updated batch status to: failed
Dec 13 07:32:40 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:40,783 - src.api.main - INFO - → OPTIONS /api/batches/96b2617f-4955-422b-9801-411759d876e6/status
Dec 13 07:32:40 gt-omr-api-1 omr-api[105880]: 2025-12-13 07:32:40,783 - src.api.main - INFO - → OPTIONS /api/batches/96b2617f-4955-422b-9801-411759d876e6/stats
Dec 13 07:32:40 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:40,783 - src.api.main - INFO - ← OPTIONS /api/batches/96b2617f-4955-422b-9801-411759d876e6/status - Status: 200
Dec 13 07:32:40 gt-omr-api-1 omr-api[105880]: 2025-12-13 07:32:40,783 - src.api.main - INFO - ← OPTIONS /api/batches/96b2617f-4955-422b-9801-411759d876e6/stats - Status: 200
Dec 13 07:32:40 gt-omr-api-1 omr-api[105880]: 2025-12-13 07:32:40,785 - src.api.main - INFO - → GET /api/batches/96b2617f-4955-422b-9801-411759d876e6/status
Dec 13 07:32:40 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:40,785 - src.api.main - INFO - → GET /api/batches/96b2617f-4955-422b-9801-411759d876e6/stats
Dec 13 07:32:40 gt-omr-api-1 omr-api[105880]: 2025-12-13 07:32:40,792 - src.api.main - INFO - ← GET /api/batches/96b2617f-4955-422b-9801-411759d876e6/status - Status: 200
Dec 13 07:32:40 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:40,792 - src.api.main - INFO - ← GET /api/batches/96b2617f-4955-422b-9801-411759d876e6/stats - Status: 200
Dec 13 07:32:40 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:40,814 - src.api.main - INFO - → OPTIONS /api/batches/96b2617f-4955-422b-9801-411759d876e6/recoverable
Dec 13 07:32:40 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:40,814 - src.api.main - INFO - ← OPTIONS /api/batches/96b2617f-4955-422b-9801-411759d876e6/recoverable - Status: 200
Dec 13 07:32:40 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:40,815 - src.api.main - INFO - → GET /api/batches/96b2617f-4955-422b-9801-411759d876e6/recoverable
Dec 13 07:32:40 gt-omr-api-1 omr-api[105883]: 2025-12-13 07:32:40,822 - src.api.main - INFO - ← GET /api/batches/96b2617f-4955-422b-9801-411759d876e6/recoverable - Status: 200

Browser text:
Batch Processing
Batch ID: 96b2617f-4955-422b-9801-411759d876e6
Failed
Batch Information
Upload Date
12/13/2025, 7:32:35 AM
Completion Date
12/13/2025, 7:32:35 AM
Total Sheets
0
Processed
0
Total Processing Time
0s
Extraction Time
0s
OMR Processing Time
0s
Error
Batch processing failed: No sheets were created

Processing Timeline
Uploaded
12/13/2025, 7:32:35 AM
Processing Started
12/13/2025, 7:32:35 AM
Failed
Batch processing failed: No sheets were created

# Report change 
Report is not not accurate