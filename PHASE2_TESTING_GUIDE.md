# Phase 2 Testing Guide

**Quick reference for testing Phase 2 Batch Upload & Management features**

---

## 🚀 Quick Start

### Access the Application

```bash
# Open in browser
http://gt-omr-web-1.gt/dashboard/batches
```

### Test Credentials

```
Username: admin
Password: admin123
```

---

## 📋 Test Scenarios

### 1. Small File Upload (Direct)

**File:** 117-with-qr.zip (36MB, 51 sheets)  
**Strategy:** ZIP with QR Codes

**Steps:**

1. Click "Upload New Batch"
2. Select "ZIP with QR Codes"
3. Choose file: `/cephfs/omr/omr_sheets/zip_with_qr/117-with-qr.zip`
4. Click "Upload Batch"

**Expected:**

- ✅ Progress bar shows smooth upload
- ✅ No chunking (file < 100MB)
- ✅ Redirects to batch details page
- ✅ Progress polls every 2 seconds
- ✅ 51 sheets processed
- ✅ Status: uploaded → validating → processing → completed
- ✅ Time: ~30 seconds

---

### 2. Large File Upload (Chunked) ⚠️ CRITICAL

**File:** 103-with-qr.zip (197MB, 291 sheets)  
**Strategy:** ZIP with QR Codes

**Steps:**

1. Click "Upload New Batch"
2. Select "ZIP with QR Codes"
3. Choose file: `/cephfs/omr/omr_sheets/zip_with_qr/103-with-qr.zip`
4. Observe "Will use chunked upload" message
5. Click "Upload Batch"

**Expected:**

- ✅ Progress shows "Uploading chunk 1/4"
- ✅ Chunks: 50MB + 50MB + 50MB + 47MB
- ✅ Progress bar updates per chunk
- ✅ Redirects to batch details after upload
- ✅ 291 sheets processed
- ✅ Status: uploaded → validating → processing → completed
- ✅ Time: ~2-3 minutes

**⚠️ NOTE:** This test requires backend chunk upload endpoint to be implemented. If not available, you'll see an error about endpoint not found.

---

### 3. ZIP without QR Upload

**File:** 117-no-qr.zip  
**Strategy:** ZIP without QR Codes  
**Task ID:** 14900117

**Steps:**

1. Click "Upload New Batch"
2. Select "ZIP without QR Codes"
3. Choose file: `/cephfs/omr/omr_sheets/zip_no_qr/117-no-qr.zip`
4. Enter Task ID: `14900117`
5. Click "Upload Batch"

**Expected:**

- ✅ Task ID field is required
- ✅ Validation: Must be 8 digits
- ✅ Upload processes normally
- ✅ Batch created with provided task_id

---

### 4. Direct Images Upload

**Files:** Multiple JPG files  
**Strategy:** Direct Images  
**Task ID:** 14900113

**Steps:**

1. Click "Upload New Batch"
2. Select "Direct Images"
3. Choose multiple files from: `/cephfs/omr/omr_sheets/real/14900113/`
4. Enter Task ID: `14900113`
5. Click "Upload Batch"

**Expected:**

- ✅ Multiple file selection works
- ✅ Total size displayed
- ✅ Task ID required
- ✅ Upload processes all images as one batch

---

### 5. Real-time Progress Monitoring

**Steps:**

1. Upload any batch
2. Navigate to batch details page
3. Observe progress updates

**Expected:**

- ✅ Progress bar updates every 2 seconds
- ✅ Sheet count increases: "X / Y sheets processed"
- ✅ Percentage updates smoothly
- ✅ Status badge changes color
- ✅ Polling stops when completed/failed
- ✅ Completion time displayed

---

### 6. Batch List & Filtering

**Steps:**

1. Go to `/dashboard/batches`
2. Test status filter dropdown
3. Select different statuses
4. Navigate through pages (if > 50 batches)

**Expected:**

- ✅ Filter by status works
- ✅ Total count updates
- ✅ Pagination shows correct pages
- ✅ Previous/Next buttons work
- ✅ Click row opens batch details

---

### 7. Admin Delete (Requires Auth Integration)

**Steps:**

1. Login as admin user
2. Go to batch list
3. Click "Delete" button on any batch
4. Confirm deletion

**Expected:**

- ✅ Delete button visible for admin
- ✅ Confirmation dialog appears
- ✅ Batch deleted from database
- ✅ List refreshes automatically

**⚠️ NOTE:** Currently requires auth integration. `isAdmin` is hardcoded to `false` in pages. See TODO comments in code.

---

## 🧪 Validation Tests

### Form Validation

**Test invalid inputs:**

| Field               | Invalid Input | Expected Error                                |
| ------------------- | ------------- | --------------------------------------------- |
| File                | None selected | "Please fill in all required fields"          |
| Task ID (ZIP no QR) | Empty         | Validation error                              |
| Task ID             | "123"         | "Task ID must be exactly 8 digits"            |
| Task ID             | "abc12345"    | "Task ID must be exactly 8 digits"            |
| Task ID             | "149001177"   | "Task ID must be exactly 8 digits" (9 digits) |

### Error Handling

**Test error scenarios:**

1. **Network Error During Upload**
   - Disconnect network mid-upload
   - Expected: Chunk retry logic kicks in
   - Expected: Up to 3 retry attempts
   - Expected: Error message if all retries fail

2. **Invalid Batch ID in URL**
   - Navigate to `/dashboard/batches/invalid-uuid`
   - Expected: Error message "Batch not found"
   - Expected: "Back to Batches" button

3. **API Server Down**
   - Stop API server
   - Expected: Error message with retry button
   - Expected: Clear error description

---

## 📊 Performance Tests

### Large Batch Performance

**Test with 90+ batches:**

1. Navigate to batch list
2. Measure page load time
3. Test pagination speed
4. Test filtering speed

**Expected:**

- ✅ Initial load < 1 second
- ✅ Filter change < 500ms
- ✅ Page navigation < 500ms
- ✅ Smooth scrolling

### Progress Polling Performance

**Test with active batch:**

1. Upload batch
2. Monitor network tab
3. Check polling frequency
4. Verify auto-stop

**Expected:**

- ✅ Polls every 2 seconds
- ✅ Stops when completed/failed
- ✅ No memory leaks
- ✅ Component unmount stops polling

---

## 🐛 Common Issues

### Issue 1: "Chunk upload endpoint not found"

**Cause:** Backend chunk upload endpoint not implemented  
**Solution:** Backend team needs to implement `POST /api/batches/upload-chunk`  
**Workaround:** Use files < 100MB for now

### Issue 2: Delete button not visible

**Cause:** `isAdmin` hardcoded to `false`  
**Solution:** Integrate authentication context  
**Workaround:** Manually change `isAdmin = true` in page component for testing

### Issue 3: Progress not updating

**Cause:** API server not responding  
**Solution:** Check API server status with `bash scripts/status-api`  
**Workaround:** Restart API servers if needed

### Issue 4: Upload fails immediately

**Cause:** No authentication token  
**Solution:** Login first at `/login`  
**Workaround:** Clear localStorage and re-login

---

## 🔍 Debugging

### Check API Requests

**Browser Console:**

```javascript
// Check auth token
localStorage.getItem('access_token');

// Check API URL
process.env.NEXT_PUBLIC_API_URL;
```

**Network Tab:**

- Filter by XHR/Fetch
- Check request headers (Authorization)
- Check response status codes
- Check response payload

### Check Server Status

```bash
# Web servers
bash scripts/status-web

# API servers
ssh gt-omr-api-1 'systemctl status omr-api'

# PM2 logs
bash scripts/pm2-web gt-omr-web-1 logs
```

### Check Database

```bash
# Count batches
mysql -e "SELECT COUNT(*) FROM omr_batches"

# Check specific batch
mysql -e "SELECT * FROM omr_batches WHERE batch_uuid = 'xxx'"

# Check recent batches
mysql -e "SELECT batch_name, status, sheet_count FROM omr_batches ORDER BY created_at DESC LIMIT 10"
```

---

## ✅ Test Checklist

### Upload Functionality

- [ ] Upload ZIP with QR codes (small file)
- [ ] Upload ZIP with QR codes (large file with chunking)
- [ ] Upload ZIP without QR codes (with task ID)
- [ ] Upload direct images (multiple files)
- [ ] Validate task ID format (8 digits)
- [ ] Handle upload errors gracefully
- [ ] Show chunk upload progress

### Progress Tracking

- [ ] Real-time progress updates (2s interval)
- [ ] Progress bar updates smoothly
- [ ] Sheet counts display correctly
- [ ] Auto-stop when completed/failed
- [ ] Handle progress fetch errors

### Batch Management

- [ ] List batches with pagination
- [ ] Filter by status
- [ ] Sort by upload date
- [ ] View detailed batch information
- [ ] Navigate between list and details

### Admin Features

- [ ] Delete button visible for admin
- [ ] Confirmation dialog works
- [ ] Batch deleted successfully
- [ ] List refreshes after delete
- [ ] Delete button hidden for non-admin

### Error Handling

- [ ] Invalid file type error
- [ ] Missing file error
- [ ] Invalid task ID error
- [ ] Network error handling
- [ ] Chunk retry logic
- [ ] API error messages

---

## 📞 Need Help?

**Questions about:**

- Upload issues → Check network tab, verify file exists
- Progress issues → Check API server status
- Filtering issues → Check query parameters in network tab
- Delete issues → Verify admin status, check console for errors

**Contact:**

- Backend team for API issues
- Frontend team for UI/UX issues
- DevOps for server/deployment issues

---

**Happy Testing!** 🚀
