# Phase 2 Frontend Handoff Package

**Date:** November 20, 2025  
**Phase:** 2 - Batch Upload & Management  
**Status:** Ready for Frontend Implementation

---

## 📦 Files to Provide to Frontend Team

### ⚠️ CRITICAL - Read First

**`CHUNKED_UPLOAD_REQUIREMENT.md`** (15KB) 🚨 **MUST READ FIRST**
   - **Critical constraint:** Cloudflare 100MB limit
   - **Blocking requirement:** Chunked upload implementation
   - Complete chunked upload code example
   - Testing requirements with large files (197MB)
   - Backend API specification for chunks
   - **Action:** Read immediately - this blocks all large file uploads

### Essential Documents (Must Read)

1. **`PHASE2_FRONTEND_PROMPT.md`** (21KB) ⭐ **START HERE**
   - Complete implementation requirements
   - User stories and objectives
   - Architecture and folder structure
   - Step-by-step implementation guide
   - 3-week timeline with daily tasks
   - Success criteria and testing checklist
   - **Action:** Read this first to understand scope and approach

2. **`PHASE2_FRONTEND_GUIDE.md`** (43KB) ⭐ **API REFERENCE**
   - Complete API endpoint specifications
   - Full TypeScript type definitions
   - Request/response examples for all endpoints
   - React/Next.js 15 component code samples
   - Error handling patterns
   - React Query integration examples
   - **Action:** Use as API documentation and copy-paste code samples

3. **`PHASE2_FRONTEND_HANDOFF.md`** (7.8KB) ⭐ **QUICK START**
   - Quick reference for all endpoints
   - Implementation roadmap summary
   - Production statistics (90+ batches)
   - Pre-implementation checklist
   - **Action:** Quick reference during implementation

---

### Supporting Documents (Reference)

4. **`PHASE2_TESTING_COMPLETE.md`** (3.6KB)
   - Backend test results with real data
   - Test file locations on server
   - curl command examples
   - Validation that API is working
   - **Action:** Use for manual testing and debugging

5. **`PHASE2_DELETE_ENDPOINT_SIMPLIFICATION.md`** (12KB)
   - Admin-only delete functionality details
   - Implementation notes and rationale
   - Future Phase 2.1 enhancements planned
   - **Action:** Reference for delete feature implementation

6. **`PHASE1_FRONTEND_GUIDE.md`** (existing)
   - Authentication patterns (already implemented)
   - API client setup examples
   - Error handling patterns
   - JWT token management
   - **Action:** Reference for consistent patterns

7. **`PHASE1_API_VERIFICATION.md`** (13KB)
   - Phase 1 API test results
   - Users CRUD endpoint examples
   - Common frontend issues and solutions
   - **Action:** Reference for auth patterns and troubleshooting

---

## 📋 How to Use These Files

### Day 1: Planning & Setup
```
1. Read PHASE2_FRONTEND_PROMPT.md completely
2. ⚠️ Understand chunked upload requirement (Cloudflare 100MB limit)
3. Review PHASE2_FRONTEND_GUIDE.md sections 1-4
4. Check PHASE2_FRONTEND_HANDOFF.md for quick reference
5. Set up folder structure from prompt
6. Plan chunked upload implementation strategy
```

### Week 1: Core Implementation
```
1. Copy TypeScript types from PHASE2_FRONTEND_GUIDE.md
2. Implement chunked upload service (50MB chunks)
3. Implement upload form using Section 1 examples
4. Add chunk upload progress tracking
5. Add processing progress monitoring using Section 2 examples
6. Reference PHASE2_FRONTEND_HANDOFF.md for endpoint URLs
7. Test with large files (> 100MB)
```

### Week 2: List & Details
```
1. Build batch list using Section 4 examples
2. Add status filtering and pagination
3. Create batch details page
4. Test with curl commands from PHASE2_TESTING_COMPLETE.md
```

### Week 3: Polish & Admin
```
1. Add delete button (admin only) from Section 5
2. Test all error scenarios
3. Add loading states and responsive design
4. Full testing checklist from PHASE2_FRONTEND_PROMPT.md
```

---

## 🎯 Quick Reference by Feature

### Upload Form
- **Prompt:** Section "📦 Implementation Details → 1. Upload Form Component"
- **Guide:** Section 1 "Upload Batch"
- **Types:** `BatchCreate`, `UploadStrategy`, `BatchResponse`
- **Code:** `PHASE2_FRONTEND_GUIDE.md` lines 120-380 (complete component)

### Progress Monitoring
- **Prompt:** Section "📦 Implementation Details → 2. Progress Monitoring"
- **Guide:** Section 2 "Batch Progress Polling"
- **Types:** `BatchProgress`
- **Code:** `PHASE2_FRONTEND_GUIDE.md` lines 550-650 (progress hook)

### Batch List
- **Prompt:** Section "📦 Implementation Details → 3. Batch List Component"
- **Guide:** Section 4 "List Batches"
- **Types:** `Batch`, `ListBatchesResponse`
- **Code:** `PHASE2_FRONTEND_GUIDE.md` lines 870-1050 (complete list component)

### Batch Details
- **Prompt:** Section "📦 Implementation Details → 4. Batch Details Page"
- **Guide:** Section 3 "Batch Status Details"
- **Types:** `BatchStatusResponse`, `SheetStatus`
- **Code:** `PHASE2_FRONTEND_GUIDE.md` lines 650-850

### Delete Batch (Admin)
- **Prompt:** Section "📦 Implementation Details → 5. Delete Functionality"
- **Guide:** Section 5 "Delete Batch"
- **Types:** None (204 No Content)
- **Code:** `PHASE2_FRONTEND_GUIDE.md` lines 1100-1270

---

## 🔑 Key Information Summary

### API Base URL
```bash
Production: http://gt-omr-api-1:8000
Alternative: http://gt-omr-api-2:8000
```

### Authentication
```typescript
// Already implemented in Phase 1
headers: {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
}
```

### Upload Strategies
```typescript
1. 'zip_with_qr'  → ZIP file with QR codes (task_id auto-extracted)
2. 'zip_no_qr'    → ZIP file without QR codes (task_id required)
3. 'images'       → Individual image files (task_id required)
```

### Test Data Locations (Server)
```bash
ZIP with QR:    /cephfs/omr/omr_sheets/zip_with_qr/117-with-qr.zip (36MB, 51 sheets)
ZIP no QR:      /cephfs/omr/omr_sheets/zip_no_qr/117-no-qr.zip (2.1MB, task_id: 14900117)
Images:         /cephfs/omr/omr_sheets/real/14900113/*.jpg (100+ files, task_id: 14900113)
```

### Batch Statuses
```typescript
- 'uploaded'      → Initial state after upload
- 'validating'    → Validating files
- 'processing'    → Processing OMR sheets
- 'completed'     → All sheets processed successfully
- 'failed'        → Processing failed
- 'reprocessing'  → Re-processing after fixes
```

### Production Statistics
```
- Total batches: 90+ (as of Nov 19, 2025)
- Largest batch: 51 sheets
- Average processing time: ~5-10 seconds per sheet
- Supported formats: JPG, JPEG, PNG
- Max file size: 100MB (recommended)
```

---

## ✅ Pre-Implementation Checklist

Before starting, ensure you have:

- [ ] Read `PHASE2_FRONTEND_PROMPT.md` completely
- [ ] Reviewed `PHASE2_FRONTEND_GUIDE.md` API specs
- [ ] Phase 1 authentication is working (login/logout)
- [ ] API base URL configured in `.env.local`
- [ ] TypeScript types copied to project
- [ ] Test admin user credentials (admin/admin123)
- [ ] Access to test data files (or know where to get them)
- [ ] shadcn/ui components installed
- [ ] React Query v5 installed and configured
- [ ] Understanding of upload strategies

---

## 🧪 Testing Strategy

### Manual Testing (Required)

**Upload Testing:**
```bash
1. Login as admin (admin/admin123)
2. Upload ZIP with QR (117-with-qr.zip)
   → Should process 51 sheets
   → Status: uploaded → validating → processing → completed
3. Upload ZIP without QR (117-no-qr.zip, task_id: 14900117)
   → Should start processing
4. Upload 5-10 individual images (task_id: 14900113)
   → Should create single batch
```

**List Testing:**
```bash
1. View batch list → Should show all user's batches
2. Filter by status → Should show only matching batches
3. Pagination → Should navigate through pages
4. Click batch → Should open details page
```

**Admin Testing:**
```bash
1. Login as admin → Should see delete buttons
2. Login as regular user → Should NOT see delete buttons
3. Admin deletes batch → Batch removed from list and DB
```

### Automated Testing (Recommended)

```typescript
// Example with React Testing Library
describe('BatchUploadForm', () => {
  it('shows task_id field for zip_no_qr strategy', () => {
    render(<BatchUploadForm />);
    fireEvent.click(screen.getByLabelText('ZIP without QR'));
    expect(screen.getByLabelText('Task ID')).toBeInTheDocument();
  });
  
  it('validates task_id format (8 digits)', () => {
    // Test validation
  });
  
  it('uploads file successfully', async () => {
    // Test upload flow
  });
});
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Upload Returns 400 Bad Request

**Possible Causes:**
- Missing task_id for zip_no_qr or images
- Invalid task_id format (not 8 digits)
- File type not supported

**Solution:**
```typescript
// Validate before upload
if ((strategy === 'zip_no_qr' || strategy === 'images') && !taskId) {
  setError('Task ID is required for this upload type');
  return;
}

if (taskId && !/^\d{8}$/.test(taskId)) {
  setError('Task ID must be exactly 8 digits');
  return;
}
```

### Issue 2: Progress Polling Doesn't Stop

**Possible Causes:**
- Not checking status in polling condition
- React Query refetchInterval not returning false

**Solution:**
```typescript
refetchInterval: (data) => {
  const completedStatuses = ['completed', 'failed'];
  return completedStatuses.includes(data?.status) ? false : 2000;
}
```

### Issue 3: Delete Button Visible to Non-Admin

**Possible Causes:**
- Not checking user.is_admin flag
- Auth context not providing user info

**Solution:**
```typescript
const { user } = useAuth();
if (!user?.is_admin) return null;
```

---

## 📞 Support Contacts

### API Questions
- Check: `PHASE2_FRONTEND_GUIDE.md` first
- Test: Use curl examples from `PHASE2_TESTING_COMPLETE.md`
- Report: Backend team with endpoint URL, payload, response

### Design Questions
- Reference: This package and UI mockups
- Patterns: Follow Phase 1 UI patterns
- Components: Use shadcn/ui where possible

### Blockers
Provide:
- Screenshot or video of issue
- Browser console errors
- Network tab showing request/response
- Code snippet where issue occurs

---

## 🎯 Success Metrics

When implementation is complete, verify:

### Functional
- ✅ All 3 upload strategies work
- ✅ Progress updates every 2 seconds
- ✅ Batch list shows correct data
- ✅ Filtering and pagination work
- ✅ Admin can delete, non-admin cannot
- ✅ All error cases handled gracefully

### Performance
- ✅ Upload form responds instantly
- ✅ Progress updates don't block UI
- ✅ List loads in < 1 second
- ✅ Pagination handles 90+ batches smoothly
- ✅ No memory leaks from polling

### User Experience
- ✅ Upload process is intuitive
- ✅ Progress is visible and clear
- ✅ Errors show actionable messages
- ✅ Navigation flows logically
- ✅ Mobile responsive

---

## 📚 File Manifest

**Core Documents (6 files):**
1. CHUNKED_UPLOAD_REQUIREMENT.md (critical constraint - read first)
2. PHASE2_FRONTEND_PROMPT.md (this guides implementation)
3. PHASE2_FRONTEND_GUIDE.md (complete API reference + code)
4. PHASE2_FRONTEND_HANDOFF.md (quick reference)
5. PHASE2_TESTING_COMPLETE.md (test results + examples)
6. PHASE2_DELETE_ENDPOINT_SIMPLIFICATION.md (delete feature details)

**Reference Documents (2 files):**
6. PHASE1_FRONTEND_GUIDE.md (auth patterns)
7. PHASE1_API_VERIFICATION.md (Phase 1 examples)

**Total Package Size:** ~140 KB text documentation

---

## 🚀 Let's Build!

You have everything needed:
- ✅ Clear requirements and user stories
- ✅ Complete API specifications with examples
- ✅ Full TypeScript types and interfaces
- ✅ React component code samples
- ✅ Testing data and scenarios
- ✅ 3-week implementation timeline
- ✅ Success criteria checklist

**Start with:** `PHASE2_FRONTEND_PROMPT.md` → Day 1 setup → Week 1 implementation

**Questions?** Reference the guide sections or contact backend team.

**Ready to code!** 🎉
