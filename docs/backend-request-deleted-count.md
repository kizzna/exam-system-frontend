# Backend Request: Deleted Sheets Count in Stats

## Context
We are implementing a "Recycle Bin" (Deleted Tab) in the OMR Editor. To improve UX, we want to display the number of deleted sheets in the tab label, e.g., `DELETED (5)`.

## Request
Please update the `GET /api/v1/tasks/stats` (or `GET /api/v1/tasks/{task_id}/stats` if applicable) endpoint to include a new field representing the total count of soft-deleted sheets for the task.

### Proposed Field
*   **Key:** `deleted_sheets_total` (or similar, e.g., `trash_count`)
*   **Type:** `integer`

### Example Response
```json
{
  "registered_total": 100,
  "present_total": 95,
  "actual_sheets_total": 95,
  "error_total": 5,
  "deleted_sheets_total": 3,  // <--- NEW FIELD
  "err_duplicate_sheets_total": 1,
  ...
}
```

## Impact
This allows the frontend to show the count without fetching the entire deleted roster, saving bandwidth and improving initial load performance.
