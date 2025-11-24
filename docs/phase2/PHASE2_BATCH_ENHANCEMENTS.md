# Phase 2 Batch Enhancements

## Overview
This document outlines the new API endpoints added to support batch recovery, cancellation, and cleanup.

## New Endpoints

### 1. Check Recoverable Data
Checks if a failed or stuck batch has data in Redis that can be recovered.

- **URL**: `GET /api/batches/{batch_id}/recoverable`
- **Auth**: Required (Admin or Owner)
- **Response**:
```json
{
  "batch_uuid": "c380e718-4985-44b5-bbe1-f572db0ca5cf",
  "has_progress_data": true,
  "recoverable_sheets_count": 15,
  "total_sheets_count": 1160,
  "is_recoverable": true
}
```
- **Frontend Usage**: Call this when displaying a failed batch. If `is_recoverable` is true, show the "Recover Results" button.

### 2. Cancel Batch
Cancels an ongoing batch processing task.

- **URL**: `POST /api/batches/{batch_id}/cancel`
- **Auth**: Required (Admin or Owner)
- **Response**:
```json
{
  "success": true,
  "message": "Batch cancellation requested"
}
```
- **Effect**: 
  - Sets a cancellation flag in Redis (`batch:{uuid}:cancel`).
  - Removes batch from processing queue if pending.
  - Workers check this flag before processing each sheet and will skip remaining sheets.
  - Updates batch status to `failed` with error message "Cancelled by user".

### 3. Delete Batch (Enhanced)
The existing delete endpoint has been enhanced to clean up Redis data.

- **URL**: `DELETE /api/batches/{batch_id}`
- **Auth**: Admin Only
- **Effect**:
  - Removes all Redis keys (`progress`, `log`, `results`, `cancel` flag).
  - Deletes batch and sheets from MySQL.

## Redis Key Structure
- **Cancellation**: `batch:{batch_uuid}:cancel` (TTL: 1 hour)
- **Progress**: `batch:{batch_uuid}:progress:current`
- **Results**: `omr:result:{sheet_id}`
