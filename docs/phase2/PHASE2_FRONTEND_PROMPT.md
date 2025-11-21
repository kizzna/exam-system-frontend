# Phase 2 Frontend Implementation Prompt

**Project:** OMR Exam Management System  
**Phase:** 2 - Batch Upload & Management  
**Technology Stack:** Next.js 15, TypeScript, shadcn/ui, React Query v5  
**Date:** November 20, 2025

---

## 🎯 Objective

Implement the **Batch Upload & Management** interface for the OMR processing system. Users should be able to:

1. Upload OMR sheets (ZIP files or individual images)
2. Monitor batch processing progress in real-time
3. View list of batches with filtering and pagination
4. Review batch details and processing status
5. Delete batches (admin only)

---

## 📋 Requirements Overview

### User Stories

**As a regular user, I want to:**
- Upload ZIP files containing OMR sheet images with or without QR codes
- Upload individual image files for processing
- See real-time progress of my batch uploads
- View a list of all my batches with status and sheet counts
- Filter batches by processing status
- See detailed information about each batch
- Monitor which batches are currently processing

**As an administrator, I want to:**
- View all batches from all users
- Delete batches for cleanup purposes
- See who uploaded each batch

---

## 🏗️ Technical Architecture

### Pages to Implement

```
app/
├── batches/
│   ├── page.tsx                    # Main batches list page
│   ├── [id]/
│   │   └── page.tsx               # Batch details page
│   └── upload/
│       └── page.tsx               # Upload page (optional separate page)
```

### Components to Create

```
components/
├── batches/
│   ├── BatchUploadForm.tsx        # Main upload form with strategy selection
│   ├── BatchProgressBar.tsx       # Real-time progress indicator
│   ├── BatchList.tsx              # Table/grid of batches with filters
│   ├── BatchStatusBadge.tsx       # Status indicator component
│   ├── BatchDetailsCard.tsx       # Detailed batch information
│   ├── DeleteBatchButton.tsx      # Admin-only delete with confirmation
│   └── UploadStrategySelector.tsx # ZIP vs Images selection
```

### Services/Hooks

```
lib/
├── api/
│   └── batches.ts                 # API client functions
└── hooks/
    ├── useBatches.ts              # React Query hook for list
    ├── useBatchDetails.ts         # React Query hook for details
    ├── useBatchUpload.ts          # Upload mutation hook
    └── useProgressPolling.ts      # Progress polling hook
```

---

## 🔌 API Integration

### Base Configuration

```typescript
// lib/config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://gt-omr-api-1:8000';
export const API_ENDPOINTS = {
  batches: {
    upload: '/api/batches/upload',
    list: '/api/batches/',
    details: (id: string) => `/api/batches/${id}/status`,
    progress: (id: string) => `/api/batches/${id}/progress`,
    delete: (id: string) => `/api/batches/${id}`
  }
};
```

### Available Endpoints

1. **POST /api/batches/upload** - Upload batch (ZIP or images)
2. **GET /api/batches/** - List batches with pagination and filtering
3. **GET /api/batches/{id}/status** - Get detailed batch status
4. **GET /api/batches/{id}/progress** - Lightweight progress polling
5. **DELETE /api/batches/{id}** - Delete batch (admin only)

See `PHASE2_FRONTEND_GUIDE.md` for complete API specifications.

---

## 📦 Implementation Details

### 1. Upload Form Component

**File:** `components/batches/BatchUploadForm.tsx`

**Features:**
- Upload strategy selection (ZIP with QR, ZIP without QR, Direct Images)
- Conditional task_id input (required for ZIP without QR and images)
- File upload with validation
- Upload progress indicator
- Success/error handling

**Key Requirements:**
```typescript
// Upload strategies
type UploadStrategy = 'zip_with_qr' | 'zip_no_qr' | 'images';

// For 'zip_no_qr' and 'images': task_id is required (8 digits)
// For 'zip_with_qr': task_id is optional (extracted from QR code)

// File validation
- ZIP files: .zip extension
- Images: .jpg, .jpeg, .png extensions
- Max file size: Configure in env (suggest 100MB for ZIP, 10MB for images)
```

**API Call Example:**
```typescript
const formData = new FormData();
formData.append('file', file);  // or 'files' for multiple
formData.append('upload_type', strategy);
if (taskId) {
  formData.append('task_id', taskId);
}

const response = await fetch('/api/batches/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

---

### 2. Progress Monitoring

**File:** `components/batches/BatchProgressBar.tsx`

**Features:**
- Real-time progress updates (poll every 2 seconds)
- Show processed/total sheets
- Progress percentage
- Status indicator (processing, completed, failed)

**Implementation Pattern:**
```typescript
// Use React Query with refetch interval
const { data: progress } = useQuery({
  queryKey: ['batch-progress', batchId],
  queryFn: () => fetchBatchProgress(batchId),
  refetchInterval: (data) => {
    // Stop polling when completed/failed
    return ['completed', 'failed'].includes(data?.status) 
      ? false 
      : 2000;
  },
  enabled: !!batchId
});
```

---

### 3. Batch List Component

**File:** `components/batches/BatchList.tsx`

**Features:**
- Paginated table/grid view
- Filter by status (uploaded, processing, completed, failed)
- Show batch name, upload date, sheet count, status
- Click row to view details
- Admin: Show uploaded_by username
- Admin: Show delete button

**Table Columns:**
```
- Batch Name (clickable to details)
- Upload Date
- Sheet Count
- Processed Count
- Status (badge with color)
- Uploaded By (admin only)
- Actions (delete for admin)
```

**Filtering:**
```typescript
const [filters, setFilters] = useState({
  status: null,  // 'uploaded' | 'processing' | 'completed' | 'failed'
  page: 1,
  page_size: 50
});
```

---

### 4. Batch Details Page

**File:** `app/batches/[id]/page.tsx`

**Features:**
- Full batch information
- Processing timeline
- Sheet-level details (if available)
- Re-process button (future enhancement)
- Download results button (future enhancement)

**Data to Display:**
```typescript
interface BatchDetails {
  batch_uuid: string;
  batch_name: string;
  upload_date: string;
  status: BatchStatus;
  total_sheets: number;
  processed_sheets: number;
  failed_sheets: number;
  completion_date?: string;
  error_message?: string;
  uploaded_by: string;  // username
}
```

---

### 5. Delete Functionality (Admin Only)

**File:** `components/batches/DeleteBatchButton.tsx`

**Features:**
- Only visible to admins
- Confirmation dialog before delete
- Success notification
- Error handling
- Refresh batch list after delete

**Important Notes:**
- Hard delete (permanent removal)
- No undo functionality in MVP
- Use with caution

```typescript
// Check admin status from auth context
const { user } = useAuth();
if (!user?.is_admin) return null;

// Confirmation
const handleDelete = async () => {
  if (!confirm(`Delete batch ${batch.batch_name}?`)) return;
  
  await deleteBatch(batchId);
  router.push('/batches');  // Redirect after delete
};
```

---

## 🎨 UI/UX Guidelines

### Status Colors

```typescript
const statusColors = {
  uploaded: 'bg-blue-100 text-blue-800',
  validating: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  reprocessing: 'bg-orange-100 text-orange-800'
};
```

### Progress Indicators

- Use linear progress bar for percentage
- Show "X / Y sheets processed" text
- Animate progress updates smoothly
- Show spinner for indeterminate states

### Upload Experience

1. **Chunked Upload** - **REQUIRED** for files > 100MB (Cloudflare limit)
2. **Drag & Drop Zone** - Allow file drop
3. **File Preview** - Show selected file name and size
4. **Upload Progress** - Show upload percentage with chunk tracking
5. **Processing Progress** - Automatically start monitoring after upload
6. **Success State** - Show success message with link to batch details

### Chunked Upload Requirements

**Critical:** Application runs behind Cloudflare with **100MB max file size limit**.

**Implementation Required:**
- Files > 100MB must be split into chunks (50MB recommended)
- Each chunk uploaded sequentially with retry logic
- Backend reassembles chunks into complete file
- Progress bar shows both upload and processing progress
- Handle chunk upload failures gracefully

**Chunk Upload Flow:**
```typescript
1. Client: Check file size
2. If > 100MB: Split into 50MB chunks
3. Upload chunk 1 → Get chunk_id
4. Upload chunk 2 → Reference previous chunk
5. Upload final chunk → Trigger processing
6. Backend: Reassemble → Process batch
```

---

## 🔐 Authentication & Permissions

### Protected Routes

All batch pages require authentication:

```typescript
// middleware.ts or layout
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  if (!token) {
    return NextResponse.redirect('/login');
  }
}
```

### Role-Based Features

```typescript
// Show/hide based on user role
const { user } = useAuth();

// Admin-only features
{user?.is_admin && (
  <>
    <DeleteBatchButton />
    <ViewAllBatchesToggle />
    <BatchOwnerColumn />
  </>
)}
```

---

## ✅ Implementation Checklist

### Phase 2A: Basic Upload & Chunking (Week 1)
- [ ] Create batch upload form component
- [ ] Implement chunked upload for files > 100MB ⚠️ **REQUIRED**
- [ ] Add chunk size management (50MB chunks)
- [ ] Implement chunk retry logic
- [ ] Add upload strategy selection
- [ ] Validate task_id input (8 digits, numeric)
- [ ] Handle upload success/error responses
- [ ] Show chunk upload progress
- [ ] Redirect to batch details after upload

### Phase 2B: Progress Monitoring (Week 1)
- [ ] Create progress bar component
- [ ] Implement progress polling hook
- [ ] Show real-time sheet processing count
- [ ] Auto-stop polling when completed/failed
- [ ] Handle polling errors gracefully

### Phase 2C: Batch List (Week 2)
- [ ] Create batch list component with table/grid
- [ ] Implement pagination
- [ ] Add status filter dropdown
- [ ] Fetch batches with React Query
- [ ] Show batch status badges
- [ ] Make rows clickable to details page

### Phase 2D: Batch Details (Week 2)
- [ ] Create batch details page
- [ ] Fetch detailed batch status
- [ ] Display batch information card
- [ ] Show processing timeline
- [ ] Add back to list navigation

### Phase 2E: Admin Features (Week 2)
- [ ] Implement delete batch button
- [ ] Add confirmation dialog
- [ ] Hide delete for non-admins
- [ ] Show uploaded_by in batch list (admin only)

### Phase 2F: Polish (Week 3)
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Implement toast notifications
- [ ] Add empty states
- [ ] Optimize re-renders
- [ ] Add responsive design
- [ ] Test all upload strategies

---

## 🧪 Testing Requirements

### Manual Testing Scenarios

1. **Upload Small ZIP with QR Code (< 100MB)**
   - Test file: Available on server at `/cephfs/omr/omr_sheets/zip_with_qr/117-with-qr.zip` (36MB)
   - Expected: Direct upload, 51 sheets processed
   - Status: Should go uploaded → validating → processing → completed

2. **Upload Large ZIP with QR Code (> 100MB)** ⚠️ **REQUIRED TEST**
   - Test file: Available at `/cephfs/omr/omr_sheets/zip_with_qr/103-with-qr.zip` (197MB)
   - Expected: Chunked upload (4 chunks × 50MB), 291 sheets processed
   - Verify: Progress shows chunk upload, then processing
   - Verify: Chunk retry works on simulated failure

3. **Upload ZIP without QR Code**
   - Test file: Available at `/cephfs/omr/omr_sheets/zip_no_qr/117-no-qr.zip`
   - Required: task_id = 14900117
   - Expected: Processing starts with provided task_id

4. **Upload Individual Images**
   - Test files: Available at `/cephfs/omr/omr_sheets/real/14900113/*.jpg`
   - Required: task_id = 14900113
   - Expected: Multiple images processed as single batch

4. **Pagination**
   - Test: Create 60+ batches (or use existing 90+ in production)
   - Verify: Page navigation works
   - Verify: Correct total count displayed

5. **Status Filtering**
   - Test: Filter by each status
   - Verify: Only matching batches shown
   - Verify: Total count updates

6. **Admin Delete**
   - Test: Login as admin, delete batch
   - Verify: Batch removed from list
   - Verify: Database confirms deletion
   - Test: Login as non-admin, delete button hidden

### Edge Cases

- [ ] Upload with invalid file type → Show error
- [ ] Upload without file selected → Show validation
- [ ] Upload without task_id (when required) → Show error
- [ ] Upload with invalid task_id format → Show validation
- [ ] **Chunk upload failure** → Retry chunk up to 3 times
- [ ] **Network interruption mid-chunk** → Resume from last successful chunk
- [ ] **File > 100MB without chunking** → Block and show error
- [ ] Network error during upload → Show retry option
- [ ] Server error response → Show clear error message
- [ ] Batch not found (invalid ID) → Show 404 page
- [ ] Progress polling when batch deleted → Stop polling
- [ ] Multiple rapid uploads → Queue properly

---

## 📊 Performance Considerations

### Optimization Strategies

1. **React Query Caching**
   ```typescript
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5000,  // Cache for 5 seconds
         cacheTime: 300000  // Keep in cache for 5 minutes
       }
     }
   });
   ```

2. **Pagination**
   - Default page size: 50 batches
   - Max page size: 100 batches
   - Use infinite scroll (optional enhancement)

3. **Polling Optimization**
   - Poll progress only for active batches
   - Stop polling when batch is completed/failed
   - Use exponential backoff on errors

4. **File Upload**
   - **Chunked upload REQUIRED for files > 100MB** (Cloudflare limit)
   - Chunk size: 50MB (recommended for optimal performance)
   - Show combined upload progress (chunks + processing)
   - Retry failed chunks up to 3 times
   - Validate file size before upload
   - Use XMLHttpRequest or Axios for chunk upload control

---

## 🚨 Error Handling

### Common Errors

```typescript
// Error types to handle
interface APIError {
  error: string;
  message: string;
  status_code: number;
  path?: string;
}

// Common status codes
- 400: Bad Request (validation failed)
- 401: Unauthorized (token expired/invalid)
- 403: Forbidden (admin-only endpoint)
- 404: Batch not found
- 413: File too large
- 500: Server error
```

### Error Display

```typescript
// Toast notification for errors
toast.error(error.message, {
  description: 'Please try again or contact support'
});

// Inline error for forms
<span className="text-red-600 text-sm">
  {fieldError?.message}
</span>
```

---

## 📚 Required Reading

Before starting implementation, review these documents:

1. **`PHASE2_FRONTEND_GUIDE.md`** (43KB)
   - Complete API specifications
   - Full TypeScript type definitions
   - Detailed request/response examples
   - React component code samples

2. **`PHASE2_FRONTEND_HANDOFF.md`** (7.8KB)
   - Quick start guide
   - Implementation roadmap
   - Production statistics
   - Pre-implementation checklist

3. **`PHASE2_TESTING_COMPLETE.md`** (3.6KB)
   - Backend test results
   - Test file locations
   - Real data examples

4. **`PHASE1_FRONTEND_GUIDE.md`**
   - Authentication patterns (already implemented)
   - API client setup
   - Error handling patterns

---

## 🎁 Code Examples

### Complete Upload Form Component

See `PHASE2_FRONTEND_GUIDE.md` Section 1.4 for full implementation including:
- Strategy selection radio buttons
- Conditional task_id input
- File upload with drag & drop
- **Chunked upload for large files (> 100MB)** ⚠️ **REQUIRED**
- Form validation with Zod
- Chunk-aware upload progress tracking
- Chunk retry logic
- Error handling

### Chunked Upload Implementation

```typescript
// lib/chunked-upload.ts
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB
const CLOUDFLARE_LIMIT = 100 * 1024 * 1024; // 100MB

interface ChunkUploadProgress {
  chunksTotal: number;
  chunksUploaded: number;
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
}

async function uploadFileInChunks(
  file: File,
  uploadType: string,
  taskId: string | null,
  onProgress: (progress: ChunkUploadProgress) => void
): Promise<{ batch_id: string }> {
  
  // Check if chunking is needed
  const needsChunking = file.size > CLOUDFLARE_LIMIT;
  
  if (!needsChunking) {
    // Direct upload for small files
    return uploadDirect(file, uploadType, taskId, onProgress);
  }
  
  // Calculate chunks
  const chunks = Math.ceil(file.size / CHUNK_SIZE);
  let uploadedChunks = 0;
  let uploadId: string | null = null;
  
  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const isLastChunk = i === chunks - 1;
    
    // Retry logic for each chunk
    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunk_index', i.toString());
        formData.append('total_chunks', chunks.toString());
        formData.append('filename', file.name);
        formData.append('upload_type', uploadType);
        
        if (uploadId) {
          formData.append('upload_id', uploadId);
        }
        if (taskId) {
          formData.append('task_id', taskId);
        }
        if (isLastChunk) {
          formData.append('is_final_chunk', 'true');
        }
        
        const response = await fetch('/api/batches/upload-chunk', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`
          },
          body: formData
        });
        
        if (!response.ok) throw new Error('Chunk upload failed');
        
        const result = await response.json();
        uploadId = result.upload_id;
        uploadedChunks++;
        success = true;
        
        // Report progress
        onProgress({
          chunksTotal: chunks,
          chunksUploaded: uploadedChunks,
          bytesUploaded: end,
          bytesTotal: file.size,
          percentage: (end / file.size) * 100
        });
        
        // If last chunk, return batch info
        if (isLastChunk) {
          return { batch_id: result.batch_id };
        }
        
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      }
    }
  }
  
  throw new Error('Upload failed');
}
```

**Usage in Component:**
```typescript
const handleUpload = async () => {
  setUploading(true);
  
  try {
    const result = await uploadFileInChunks(
      file,
      uploadType,
      taskId,
      (progress) => {
        setUploadProgress(progress.percentage);
        setChunkInfo(`${progress.chunksUploaded}/${progress.chunksTotal} chunks`);
      }
    );
    
    // Start monitoring batch processing
    router.push(`/batches/${result.batch_id}`);
  } catch (error) {
    setError(error.message);
  } finally {
    setUploading(false);
  }
};
```

### Complete Batch List Component

See `PHASE2_FRONTEND_GUIDE.md` Section 4.4 for full implementation including:
- React Query integration
- Pagination controls
- Status filtering
- Table with sortable columns
- Click-to-details navigation

### Progress Polling Hook

See `PHASE2_FRONTEND_GUIDE.md` Section 2.5 for:
- Custom `useProgressPolling` hook
- Auto-stop on completion
- Error handling
- Optimistic updates

---

## 🔗 API Endpoints Quick Reference

```typescript
// Upload batch
POST /api/batches/upload
Content-Type: multipart/form-data
Body: {
  file: File | File[],
  upload_type: 'zip_with_qr' | 'zip_no_qr' | 'images',
  task_id?: string  // Required for zip_no_qr and images
}
Response: { batch_id: string, status: string, ... }

// Get batch progress (lightweight polling)
GET /api/batches/{batch_id}/progress
Response: {
  batch_uuid: string,
  status: string,
  sheet_count: number,
  processed_count: number,
  failed_count: number,
  progress_percentage: number,
  created_at: string,
  completed_at: string | null
}

// Get batch details (detailed status)
GET /api/batches/{batch_id}/status
Response: { /* Full batch details with sheet-level info */ }

// List batches
GET /api/batches/?page=1&page_size=50&status=processing
Response: {
  total: number,
  limit: number,
  offset: number,
  batches: Batch[]
}

// Delete batch (admin only)
DELETE /api/batches/{batch_id}
Response: 204 No Content
```

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ Users can upload OMR sheets via all 3 strategies
- ✅ Progress updates in real-time (2-second polling)
- ✅ Batch list shows all user's batches
- ✅ Filtering by status works correctly
- ✅ Pagination handles 90+ batches smoothly
- ✅ Admin can delete batches
- ✅ Non-admin users cannot see delete button

### Non-Functional Requirements
- ✅ Upload form validates inputs before submission
- ✅ Error messages are clear and actionable
- ✅ Loading states prevent duplicate submissions
- ✅ Progress polling stops when batch completes
- ✅ List performance: < 1 second load time
- ✅ Mobile responsive design

### User Experience
- ✅ Upload process is intuitive (max 3 clicks)
- ✅ Progress is visible and reassuring
- ✅ Success/failure is clearly indicated
- ✅ Navigation is logical (upload → progress → list → details)
- ✅ No data loss on page refresh (query params preserved)

---

## 📞 Support & Questions

### During Implementation

**Questions about API:**
- Reference: `PHASE2_FRONTEND_GUIDE.md`
- Test: Use `curl` examples in `PHASE2_TESTING_COMPLETE.md`
- Contact: Backend team with specific endpoint/error

**Questions about Design:**
- Reference: This document and UI mockups (if provided)
- Patterns: Follow Phase 1 authentication UI patterns
- shadcn/ui: Use existing components where possible

**Blockers:**
- API not working: Contact backend team with:
  - Endpoint URL
  - Request payload
  - Response status + body
  - Browser console errors
- Data issues: Check test data files on server
- Performance issues: Share React DevTools profiler results

---

## 🚀 Getting Started

### Step 1: Review Documentation (Day 1)
- [ ] Read this prompt completely
- [ ] Review `PHASE2_FRONTEND_GUIDE.md`
- [ ] Study TypeScript types and interfaces
- [ ] Understand upload strategies

### Step 2: Setup (Day 1)
- [ ] Create folder structure (`components/batches`, `lib/api`)
- [ ] Add TypeScript types to `types/batches.ts`
- [ ] Configure API base URL in `.env.local`
- [ ] Test API connection with login (already working)

### Step 3: Core Implementation (Week 1-2)
- [ ] Implement upload form (Day 2-3)
- [ ] Add progress monitoring (Day 4)
- [ ] Build batch list (Day 5-6)
- [ ] Create details page (Day 7-8)

### Step 4: Admin Features (Week 2)
- [ ] Add delete functionality (Day 9)
- [ ] Test with admin/non-admin users (Day 10)

### Step 5: Polish & Test (Week 3)
- [ ] Error handling (Day 11-12)
- [ ] Loading states (Day 13)
- [ ] Responsive design (Day 14)
- [ ] Full testing all scenarios (Day 15)

---

## 📦 Deliverables

When complete, provide:

1. **Code Repository**
   - All components committed to feature branch
   - Clean, commented code
   - TypeScript with no type errors

2. **Testing Video/Screenshots**
   - Upload all 3 strategies
   - Progress monitoring
   - Batch list with filters
   - Admin delete functionality

3. **Known Issues Document**
   - Any edge cases found
   - Performance bottlenecks
   - Browser compatibility issues
   - Suggestions for improvements

---

## 🎉 Next Steps (Phase 3)

After Phase 2 is complete and tested:

**Phase 3: Tasks & Assignment**
- Task list with hierarchy-based filtering
- Task assignment workflow
- Fair distribution tool
- Admin dashboard

Expected start: After Phase 2 acceptance testing (approx 3 weeks)

---

**Good luck! The API is fully tested and ready. Focus on creating a smooth, intuitive user experience. Remember: the upload process is the main entry point to the system, so make it feel effortless.**
