# Backend API Requirements: Task List Pagination

## Overview
The frontend has been updated to use a high-performance table with server-side pagination to handle large datasets (25k+ tasks). However, the current `GET /tasks/` endpoint returns all records regardless of pagination parameters.

We need the backend to support pagination for the `GET /tasks/` endpoint to improve performance and reduce payload size.

## Required Changes

### Endpoint: `GET /tasks/`

#### 1. Query Parameters
Support the following query parameters for pagination:
- `page`: (Integer, Optional) Page number, 1-based index. Default: `1`.
- `size`: (Integer, Optional) Number of items per page. Default: `50`.

*Existing filters (eval_center_id, processing_status, etc.) should continue to work in conjunction with pagination.*

#### 2. Response Structure
Change the response from a flat array `Task[]` to a structured object `PaginatedResponse<Task>` containing metadata.

**Current Response (Flat Array):**
```json
[
  { "id": 1, ... },
  { "id": 2, ... },
  ...
]
```

**Required Response (Paginated Object):**
```json
{
  "items": [
    { "id": 1, ... },
    { "id": 2, ... }
  ],
  "total": 25430,      // Total number of records matching filters
  "page": 1,           // Current page number
  "size": 50,          // Current page size
  "pages": 509         // Total number of pages
}
```

### Example Request
`GET /tasks/?page=2&size=10&processing_status=pending`

### Example Response
```json
{
  "items": [
    {
      "id": 101,
      "task_id": 67600143,
      "exam_center_code": 676001,
      "class_group": 3,
      "class_level": 3,
      "eval_center_id": 1,
      "processing_status": "pending",
      "registered_amount": 2,
      "present_amount": 1,
      "actual_sheet_count": 0,
      "assigned_user_id": null,
      "error_count": 0,
      "created_at": "2025-11-15T19:15:22"
    },
    ... (9 more items)
  ],
  "total": 150,
  "page": 2,
  "size": 10,
  "pages": 15
}
```

## Impact
- **Frontend**: The frontend is already updated to expect this structure (`PaginatedResponse`). Once the backend is updated, the Task List will automatically start working correctly with pagination.
- **Performance**: This will drastically reduce the load time for the Task List, as we will only fetch 50 rows at a time instead of 25,000+.
