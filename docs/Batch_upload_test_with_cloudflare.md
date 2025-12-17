# Test batch upload with chunking
## Set 1: 809 MB ZIP / 1160 sheets
Browser console:
[Upload] File: 116.zip, Size: 790.16MB, Chunking: true
48-fcf314005e4afdfb.js:1 [Chunked Upload] File: 116.zip, Size: 790.16MB, Chunks: 16
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 1/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Upload ID: 90b3208d-b0cb-4f25-8fa2-1a5091741d84
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 2/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 3/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 4/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 5/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 6/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 7/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 8/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 9/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 10/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 11/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 12/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 13/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 14/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 15/16: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 16/16: 40.16MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Complete! Batch ID: de53c36e-f353-43d8-9659-3c81e08e805c

Api log:
Dec 17 12:37:33 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:33,543 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:37:38 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:38,655 - src.api.routers.batches - INFO - Chunk upload: chunk 1/16 by user admin
Dec 17 12:37:38 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:38,655 - src.api.services.chunked_upload - INFO - New chunked upload started: 90b3208d-b0cb-4f25-8fa2-1a5091741d84 (116.zip, 16 chunks)
Dec 17 12:37:38 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:38,698 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 1/16 (50.00MB)
Dec 17 12:37:38 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:38,709 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:37:38 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:38,901 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:37:43 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:43,959 - src.api.routers.batches - INFO - Chunk upload: chunk 2/16 by user admin
Dec 17 12:37:44 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:44,002 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 2/16 (50.00MB)
Dec 17 12:37:44 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:44,012 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:37:44 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:44,212 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:37:48 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:48,932 - src.api.routers.batches - INFO - Chunk upload: chunk 3/16 by user admin
Dec 17 12:37:48 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:48,975 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 3/16 (50.00MB)
Dec 17 12:37:48 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:48,985 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:37:49 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:49,175 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:37:54 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:54,059 - src.api.routers.batches - INFO - Chunk upload: chunk 4/16 by user admin
Dec 17 12:37:54 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:54,102 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 4/16 (50.00MB)
Dec 17 12:37:54 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:54,112 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:37:54 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:54,319 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:37:58 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:58,991 - src.api.routers.batches - INFO - Chunk upload: chunk 5/16 by user admin
Dec 17 12:37:59 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:59,034 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 5/16 (50.00MB)
Dec 17 12:37:59 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:59,044 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:37:59 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:37:59,249 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:38:04 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:04,070 - src.api.routers.batches - INFO - Chunk upload: chunk 6/16 by user admin
Dec 17 12:38:04 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:04,113 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 6/16 (50.00MB)
Dec 17 12:38:04 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:04,123 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:38:04 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:04,308 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:38:08 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:08,951 - src.api.routers.batches - INFO - Chunk upload: chunk 7/16 by user admin
Dec 17 12:38:08 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:08,994 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 7/16 (50.00MB)
Dec 17 12:38:09 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:09,003 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:38:09 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:09,200 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:38:13 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:13,765 - src.api.routers.batches - INFO - Chunk upload: chunk 8/16 by user admin
Dec 17 12:38:13 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:13,808 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 8/16 (50.00MB)
Dec 17 12:38:13 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:13,820 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:38:14 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:14,038 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:38:18 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:18,649 - src.api.routers.batches - INFO - Chunk upload: chunk 9/16 by user admin
Dec 17 12:38:18 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:18,691 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 9/16 (50.00MB)
Dec 17 12:38:18 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:38:18,701 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:38:18 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:18,905 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:38:23 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:23,394 - src.api.routers.batches - INFO - Chunk upload: chunk 10/16 by user admin
Dec 17 12:38:23 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:23,436 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 10/16 (50.00MB)
Dec 17 12:38:23 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:23,446 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:38:23 gt-omr-api-1 omr-api[124671]: 2025-12-17 12:38:23,650 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:38:28 gt-omr-api-1 omr-api[124671]: 2025-12-17 12:38:28,179 - src.api.routers.batches - INFO - Chunk upload: chunk 11/16 by user admin
Dec 17 12:38:28 gt-omr-api-1 omr-api[124671]: 2025-12-17 12:38:28,223 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 11/16 (50.00MB)
Dec 17 12:38:28 gt-omr-api-1 omr-api[124671]: 2025-12-17 12:38:28,233 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:38:28 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:28,429 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:38:32 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:32,846 - src.api.routers.batches - INFO - Chunk upload: chunk 12/16 by user admin
Dec 17 12:38:32 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:32,889 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 12/16 (50.00MB)
Dec 17 12:38:32 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:32,899 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:38:33 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:33,086 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:38:37 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:37,472 - src.api.routers.batches - INFO - Chunk upload: chunk 13/16 by user admin
Dec 17 12:38:37 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:37,514 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 13/16 (50.00MB)
Dec 17 12:38:37 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:37,525 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:38:37 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:37,706 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:38:43 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:43,390 - src.api.routers.batches - INFO - Chunk upload: chunk 14/16 by user admin
Dec 17 12:38:43 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:43,432 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 14/16 (50.00MB)
Dec 17 12:38:43 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:43,442 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:38:43 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:43,660 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:38:48 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:48,945 - src.api.routers.batches - INFO - Chunk upload: chunk 15/16 by user admin
Dec 17 12:38:48 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:48,988 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 15/16 (50.00MB)
Dec 17 12:38:48 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:48,998 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:38:49 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:49,193 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:38:53 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:53,236 - src.api.routers.batches - INFO - Chunk upload: chunk 16/16 by user admin
Dec 17 12:38:53 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:53,271 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Saved chunk 16/16 (40.16MB)
Dec 17 12:38:53 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:53,272 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: All 16 chunks received, reassembling...
Dec 17 12:38:53 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:53,834 - src.api.services.chunked_upload - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: Reassembly complete - 790.16MB total
Dec 17 12:38:53 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:38:53,837 - src.api.routers.batches - INFO - Upload 90b3208d-b0cb-4f25-8fa2-1a5091741d84: All chunks received, triggering batch processing

# Set 2: 196.01 MB / 291 sheets
Browser console:
[Upload] File: 103.zip, Size: 196.01MB, Chunking: true
48-fcf314005e4afdfb.js:1 [Chunked Upload] File: 103.zip, Size: 196.01MB, Chunks: 4
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 1/4: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Upload ID: 35f7578b-4184-407e-ae14-9527711eb6f5
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 2/4: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 3/4: 50.00MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Chunk 4/4: 46.01MB
48-fcf314005e4afdfb.js:1 [Chunked Upload] Complete! Batch ID: fae4fb04-6e5f-4b36-93cf-276e5fff9e18

Api:
Dec 17 12:50:47 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:50:47,189 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:50:48 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:50:48,757 - src.api.routers.batches - INFO - Chunk upload: chunk 1/4 by user admin
Dec 17 12:50:48 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:50:48,758 - src.api.services.chunked_upload - INFO - New chunked upload started: 35f7578b-4184-407e-ae14-9527711eb6f5 (103.zip, 4 chunks)
Dec 17 12:50:48 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:50:48,801 - src.api.services.chunked_upload - INFO - Upload 35f7578b-4184-407e-ae14-9527711eb6f5: Saved chunk 1/4 (50.00MB)
Dec 17 12:50:48 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:50:48,813 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:50:48 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:50:48,962 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:50:50 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:50:50,576 - src.api.routers.batches - INFO - Chunk upload: chunk 2/4 by user admin
Dec 17 12:50:50 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:50:50,620 - src.api.services.chunked_upload - INFO - Upload 35f7578b-4184-407e-ae14-9527711eb6f5: Saved chunk 2/4 (50.00MB)
Dec 17 12:50:50 gt-omr-api-1 omr-api[124672]: 2025-12-17 12:50:50,629 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:50:50 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:50:50,762 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:50:52 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:50:52,278 - src.api.routers.batches - INFO - Chunk upload: chunk 3/4 by user admin
Dec 17 12:50:52 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:50:52,320 - src.api.services.chunked_upload - INFO - Upload 35f7578b-4184-407e-ae14-9527711eb6f5: Saved chunk 3/4 (50.00MB)
Dec 17 12:50:52 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:50:52,329 - src.api.main - INFO - ← POST /api/batches/upload-chunk - Status: 202
Dec 17 12:50:52 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:50:52,462 - src.api.main - INFO - → POST /api/batches/upload-chunk
Dec 17 12:50:53 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:50:53,857 - src.api.routers.batches - INFO - Chunk upload: chunk 4/4 by user admin
Dec 17 12:50:53 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:50:53,897 - src.api.services.chunked_upload - INFO - Upload 35f7578b-4184-407e-ae14-9527711eb6f5: Saved chunk 4/4 (46.01MB)
Dec 17 12:50:53 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:50:53,897 - src.api.services.chunked_upload - INFO - Upload 35f7578b-4184-407e-ae14-9527711eb6f5: All 4 chunks received, reassembling...
Dec 17 12:50:54 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:50:54,061 - src.api.services.chunked_upload - INFO - Upload 35f7578b-4184-407e-ae14-9527711eb6f5: Reassembly complete - 196.01MB total
Dec 17 12:50:54 gt-omr-api-1 omr-api[124674]: 2025-12-17 12:50:54,064 - src.api.routers.batches - INFO - Upload 35f7578b-4184-407e-ae14-9527711eb6f5: All chunks received, triggering batch processing

# Set 3: 7102 MB / 11404 sheets
