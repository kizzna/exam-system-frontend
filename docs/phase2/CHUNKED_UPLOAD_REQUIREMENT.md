# ⚠️ CRITICAL: Chunked Upload Requirement

**Date:** November 20, 2025  
**Priority:** CRITICAL  
**Impact:** Upload functionality will fail for files > 100MB without this

---

## 🚨 The Problem

**Cloudflare Constraint:** Application runs behind Cloudflare which has a **hard limit of 100MB per HTTP request**.

**Impact:**
- Many OMR ZIP files exceed 100MB (tested files range from 36MB to 197MB)
- Largest production file: **197MB** (291 sheets)
- Without chunked upload: **Files > 100MB cannot be uploaded**

---

## ✅ The Solution: Chunked Upload

### Requirements

**MUST implement chunked upload for Phase 2 MVP:**
- Split files > 100MB into chunks (recommended: 50MB per chunk)
- Upload chunks sequentially
- Backend reassembles chunks into complete file
- Show combined progress (chunk upload + processing)
- Implement retry logic for failed chunks

### Implementation Strategy

**Client Side (Frontend):**
1. Check file size before upload
2. If file > 100MB: Split into 50MB chunks
3. Upload each chunk with metadata:
   - `chunk_index`: Current chunk number (0-based)
   - `total_chunks`: Total number of chunks
   - `upload_id`: Unique ID for this upload (generated after first chunk)
   - `filename`: Original filename
   - `is_final_chunk`: Boolean flag for last chunk
4. Track progress per chunk
5. Retry failed chunks up to 3 times
6. After final chunk: Backend triggers batch processing

**Server Side (Backend):**
1. Receive first chunk → Generate `upload_id` → Store chunk
2. Receive subsequent chunks → Validate `upload_id` → Append to file
3. Receive final chunk → Reassemble complete file → Trigger processing
4. Clean up temporary chunks after successful assembly

---

## 📋 Implementation Checklist

### Week 1: MUST HAVE
- [ ] Create `lib/chunked-upload.ts` utility
- [ ] Implement file size check (if > 100MB, use chunks)
- [ ] Split large files into 50MB chunks
- [ ] Upload chunks sequentially with metadata
- [ ] Track chunk upload progress
- [ ] Implement chunk retry logic (3 attempts)
- [ ] Handle chunk upload errors gracefully
- [ ] Test with 197MB file (4 chunks)

### Backend Support Needed
- [ ] Create `/api/batches/upload-chunk` endpoint
- [ ] Implement chunk storage (temp directory)
- [ ] Implement chunk reassembly
- [ ] Return `upload_id` on first chunk
- [ ] Validate chunk sequence and completeness
- [ ] Clean up temp chunks after success/failure

---

## 💻 Code Example

### Chunked Upload Service

```typescript
// lib/chunked-upload.ts
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB
const CLOUDFLARE_LIMIT = 100 * 1024 * 1024; // 100MB
const MAX_RETRIES = 3;

interface ChunkUploadProgress {
  chunksTotal: number;
  chunksUploaded: number;
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
  currentChunk: number;
}

export async function uploadFileInChunks(
  file: File,
  uploadType: 'zip_with_qr' | 'zip_no_qr' | 'images',
  taskId: string | null,
  onProgress: (progress: ChunkUploadProgress) => void
): Promise<{ batch_id: string }> {
  
  // For small files, use direct upload
  if (file.size <= CLOUDFLARE_LIMIT) {
    return uploadDirect(file, uploadType, taskId, onProgress);
  }
  
  // Calculate number of chunks needed
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let uploadId: string | null = null;
  let uploadedBytes = 0;
  
  console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)}MB, chunks: ${totalChunks}`);
  
  // Upload each chunk
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const isLastChunk = chunkIndex === totalChunks - 1;
    
    console.log(`Uploading chunk ${chunkIndex + 1}/${totalChunks} (${(chunk.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Retry logic for this chunk
    let retryCount = 0;
    let chunkUploaded = false;
    
    while (retryCount < MAX_RETRIES && !chunkUploaded) {
      try {
        const formData = new FormData();
        formData.append('chunk', chunk, `${file.name}.part${chunkIndex}`);
        formData.append('chunk_index', chunkIndex.toString());
        formData.append('total_chunks', totalChunks.toString());
        formData.append('filename', file.name);
        formData.append('upload_type', uploadType);
        formData.append('is_final_chunk', isLastChunk.toString());
        
        if (uploadId) {
          formData.append('upload_id', uploadId);
        }
        if (taskId) {
          formData.append('task_id', taskId);
        }
        
        const response = await fetch('/api/batches/upload-chunk', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: formData
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `Chunk ${chunkIndex} upload failed`);
        }
        
        const result = await response.json();
        
        // Save upload_id from first chunk
        if (chunkIndex === 0) {
          uploadId = result.upload_id;
        }
        
        // Update progress
        uploadedBytes = end;
        onProgress({
          chunksTotal: totalChunks,
          chunksUploaded: chunkIndex + 1,
          bytesUploaded: uploadedBytes,
          bytesTotal: file.size,
          percentage: (uploadedBytes / file.size) * 100,
          currentChunk: chunkIndex + 1
        });
        
        chunkUploaded = true;
        
        // If last chunk, return batch info
        if (isLastChunk) {
          console.log('All chunks uploaded successfully, batch created:', result.batch_id);
          return { batch_id: result.batch_id };
        }
        
      } catch (error) {
        retryCount++;
        console.error(`Chunk ${chunkIndex} upload attempt ${retryCount} failed:`, error);
        
        if (retryCount >= MAX_RETRIES) {
          throw new Error(
            `Failed to upload chunk ${chunkIndex + 1}/${totalChunks} after ${MAX_RETRIES} attempts: ${error.message}`
          );
        }
        
        // Exponential backoff before retry
        const delayMs = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw new Error('Upload failed: Unknown error');
}

// Direct upload for small files
async function uploadDirect(
  file: File,
  uploadType: string,
  taskId: string | null,
  onProgress: (progress: ChunkUploadProgress) => void
): Promise<{ batch_id: string }> {
  const formData = new FormData();
  
  if (uploadType === 'images') {
    formData.append('files', file);
  } else {
    formData.append('file', file);
  }
  
  formData.append('upload_type', uploadType);
  if (taskId) {
    formData.append('task_id', taskId);
  }
  
  // Track upload progress with XMLHttpRequest
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress({
          chunksTotal: 1,
          chunksUploaded: 0,
          bytesUploaded: e.loaded,
          bytesTotal: e.total,
          percentage: (e.loaded / e.total) * 100,
          currentChunk: 1
        });
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 202) {
        const result = JSON.parse(xhr.responseText);
        resolve({ batch_id: result.batch_id });
      } else {
        reject(new Error('Upload failed'));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    
    xhr.open('POST', '/api/batches/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('access_token')}`);
    xhr.send(formData);
  });
}
```

### Usage in Component

```typescript
'use client';

import { useState } from 'react';
import { uploadFileInChunks } from '@/lib/chunked-upload';

export function BatchUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chunkInfo, setChunkInfo] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    
    try {
      const result = await uploadFileInChunks(
        file,
        'zip_with_qr',
        null,
        (progress) => {
          setUploadProgress(progress.percentage);
          if (progress.chunksTotal > 1) {
            setChunkInfo(`Chunk ${progress.currentChunk}/${progress.chunksTotal}`);
          }
        }
      );
      
      // Navigate to batch details
      router.push(`/batches/${result.batch_id}`);
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        accept=".zip,.jpg,.jpeg,.png"
      />
      
      {file && (
        <div className="mt-2 text-sm">
          <p>File: {file.name}</p>
          <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          {file.size > 100 * 1024 * 1024 && (
            <p className="text-orange-600">
              ⚠️ Large file - will be uploaded in chunks
            </p>
          )}
        </div>
      )}
      
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>{chunkInfo || 'Uploading...'}</span>
            <span>{uploadProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
      
      <button 
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
```

---

## 🧪 Testing Requirements

### Test Files

**Small File (< 100MB):**
- `/cephfs/omr/omr_sheets/zip_with_qr/117-with-qr.zip` (36MB)
- Expected: Direct upload (no chunking)
- Chunks: 1
- Time: ~10-15 seconds

**Large File (> 100MB):**
- `/cephfs/omr/omr_sheets/zip_with_qr/103-with-qr.zip` (197MB)
- Expected: Chunked upload
- Chunks: 4 (50MB + 50MB + 50MB + 47MB)
- Time: ~60-90 seconds

### Test Scenarios

1. **Small File Upload**
   - Upload 117-with-qr.zip (36MB)
   - Verify: Direct upload used (no chunks)
   - Verify: Progress bar shows smooth progress
   - Verify: Batch created successfully

2. **Large File Upload**
   - Upload 103-with-qr.zip (197MB)
   - Verify: Chunked upload used (4 chunks)
   - Verify: Progress shows "Chunk 1/4", "Chunk 2/4", etc.
   - Verify: All chunks upload successfully
   - Verify: Batch created after final chunk
   - Verify: 291 sheets processed

3. **Chunk Retry**
   - Simulate network failure during chunk 2
   - Verify: Chunk retries automatically
   - Verify: Upload continues after retry
   - Verify: Success after retry

4. **Upload Failure**
   - Simulate persistent network failure
   - Verify: Error shown after 3 retry attempts
   - Verify: User can retry entire upload

---

## 🚨 Common Issues

### Issue 1: File > 100MB fails immediately

**Symptom:** Cloudflare returns 413 Payload Too Large

**Solution:** Implement chunked upload (this document)

### Issue 2: Chunks uploaded but batch not created

**Possible Causes:**
- Final chunk flag not set
- Backend not reassembling chunks
- Upload ID mismatch

**Solution:**
- Verify `is_final_chunk: true` on last chunk
- Check backend chunk reassembly logic
- Ensure upload_id consistent across all chunks

### Issue 3: Progress bar jumps/resets

**Possible Causes:**
- Progress calculated per chunk, not total file
- Not tracking cumulative bytes uploaded

**Solution:**
```typescript
// Use cumulative bytes, not chunk bytes
percentage: (uploadedBytes / file.size) * 100
// NOT: (chunk.size / file.size) * 100
```

---

## 📊 Backend API Specification

### New Endpoint Required: `/api/batches/upload-chunk`

```typescript
POST /api/batches/upload-chunk
Authorization: Bearer {token}
Content-Type: multipart/form-data

// Request Body
{
  chunk: File,                    // Chunk blob (50MB max)
  chunk_index: number,            // 0-based chunk index
  total_chunks: number,           // Total chunks in upload
  filename: string,               // Original filename
  upload_type: string,            // 'zip_with_qr' | 'zip_no_qr' | 'images'
  upload_id?: string,             // Set from chunk 1 onwards
  task_id?: string,               // Required for zip_no_qr and images
  is_final_chunk: boolean         // true for last chunk
}

// Response (First Chunk)
{
  upload_id: "uuid",              // Save this for subsequent chunks
  chunk_index: 0,
  chunks_received: 1,
  total_chunks: 4
}

// Response (Middle Chunks)
{
  upload_id: "uuid",
  chunk_index: 2,
  chunks_received: 3,
  total_chunks: 4
}

// Response (Final Chunk)
{
  upload_id: "uuid",
  chunk_index: 3,
  chunks_received: 4,
  total_chunks: 4,
  batch_id: "batch-uuid",         // Batch created!
  status: "uploaded",
  message: "Batch uploaded successfully"
}
```

---

## ✅ Success Criteria

**Phase 2 is NOT complete without:**
- ✅ Files up to 100MB upload successfully (direct)
- ✅ Files 100MB-10GB upload successfully (chunked)
- ✅ Progress shows chunk information for large files
- ✅ Failed chunks retry automatically (up to 3 times)
- ✅ Chunk upload errors show clear messages
- ✅ Test file (197MB) uploads and processes 291 sheets
- ✅ No Cloudflare 413 errors for any file size

---

## 🎯 Priority

**CRITICAL - BLOCKING REQUIREMENT**

Without chunked upload:
- ❌ Cannot upload files > 100MB
- ❌ Many production files cannot be processed
- ❌ System unusable for large batches
- ❌ MVP incomplete

**Timeline:** Must be implemented in Week 1 of Phase 2

**Dependencies:** Backend team needs to implement `/api/batches/upload-chunk` endpoint

---

## 📞 Questions?

Contact backend team with:
- File size being tested
- Chunk configuration (size, count)
- Error messages
- Network tab showing request/response
- Console logs showing chunk progress

**This is a critical requirement - prioritize accordingly!**
