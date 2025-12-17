# API Unified Gateway Test Results

## Test Environment
- Server: dev-container, omr-frontend-dev.gt:3000, started with pnpm dev
- API Gateway: http://gt-omr-api.gt:8000
- Next.js: http://omr-frontend-dev.gt:3000

## Test Results
- Main page works
- Login/Logout works
- User list/add/edit/delete works
- List Evaluation Centers works
- List Profiles works
- List Tasks works
- List Batches works
- Upload batch does not work (36MB)
Browser:
[Batches API] Sample batch data: Object
48-c79d3330fdcb2bee.js:1 [Batches API] Sample batch data: Object
48-c79d3330fdcb2bee.js:1 [Batches API] Sample batch data: Object
48-c79d3330fdcb2bee.js:1 [Batches API] Sample batch data: Object
48-c79d3330fdcb2bee.js:1 [Batches API] Sample batch data: Object
48-c79d3330fdcb2bee.js:1 [Upload] File: 117 (1).zip, Size: 35.24MB, Chunking: false
/api/api/batches/upload:1  Failed to load resource: the server responded with a status of 500 ()
Api log:
Dec 16 18:52:02 gt-omr-api-1 omr-api[124671]: 2025-12-16 18:52:02,512 - src.api.main - INFO - → POST /api/api/batches/upload
Dec 16 18:52:02 gt-omr-api-1 omr-api[124671]: 2025-12-16 18:52:02,513 - src.api.main - WARNING - HTTP 404: Not Found - Path: /api/api/batches/upload
Dec 16 18:52:02 gt-omr-api-1 omr-api[124671]: 2025-12-16 18:52:02,514 - src.api.main - INFO - ← POST /api/api/batches/upload - Status: 404
- Upload batch, chunk upload (200MB):
Browser:
[Upload] File: 103.zip, Size: 196.01MB, Chunking: true
48-c79d3330fdcb2bee.js:1 [Chunked Upload] File: 103.zip, Size: 196.01MB, Chunks: 4
48-c79d3330fdcb2bee.js:1 [Chunked Upload] Chunk 1/4: 50.00MB
48-c79d3330fdcb2bee.js:1  POST https://omr.gongtham.net/api/api/batches/upload-chunk 500 (Internal Server Error)
48-c79d3330fdcb2bee.js:1 [Chunked Upload] Chunk 1 attempt 1 failed: Error: Upload failed
48-c79d3330fdcb2bee.js:1 [Chunked Upload] Retrying chunk 1 in 2000ms...
48-c79d3330fdcb2bee.js:1  POST https://omr.gongtham.net/api/api/batches/upload-chunk 404 (Not Found)
Api log:
Dec 16 18:58:53 gt-omr-api-1 omr-api[124672]: 2025-12-16 18:58:53,633 - src.api.main - INFO - → POST /api/api/batches/upload-chunk
Dec 16 18:58:53 gt-omr-api-1 omr-api[124672]: 2025-12-16 18:58:53,634 - src.api.main - WARNING - HTTP 404: Not Found - Path: /api/api/batches/upload-chunk
Dec 16 18:58:53 gt-omr-api-1 omr-api[124672]: 2025-12-16 18:58:53,634 - src.api.main - INFO - ← POST /api/api/batches/upload-chunk - Status: 404
Dec 16 18:59:12 gt-omr-api-1 omr-api[124673]: 2025-12-16 18:59:12,681 - src.api.main - INFO - → POST /api/api/batches/upload-chunk
Dec 16 18:59:12 gt-omr-api-1 omr-api[124673]: 2025-12-16 18:59:12,682 - src.api.main - WARNING - HTTP 404: Not Found - Path: /api/api/batches/upload-chunk
Dec 16 18:59:12 gt-omr-api-1 omr-api[124673]: 2025-12-16 18:59:12,682 - src.api.main - INFO - ← POST /api/api/batches/upload-chunk - Status: 404
Dec 16 18:59:34 gt-omr-api-1 omr-api[124672]: 2025-12-16 18:59:34,165 - src.api.main - INFO - → POST /api/api/batches/upload-chunk
Dec 16 18:59:34 gt-omr-api-1 omr-api[124672]: 2025-12-16 18:59:34,167 - src.api.main - WARNING - HTTP 404: Not Found - Path: /api/api/batches/upload-chunk
Dec 16 18:59:34 gt-omr-api-1 omr-api[124672]: 2025-12-16 18:59:34,167 - src.api.main - INFO - ← POST /api/api/batches/upload-chunk - Status: 404
