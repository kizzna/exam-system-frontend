# Frontend Task Management Implementation Guide

This guide details how to implement task assignment, status updates, and unassignment using the new API endpoints.

## 1. Task Assignment
**Endpoint:** `POST /api/tasks/assign`

Assigns tasks to a specific user.

**Request Body:**
```json
{
  "user_id": 123,
  "permission_level": "upload",
  "task_ids": [101, 102, 103]
}
```

**Response:**
```json
{
  "message": "Successfully assigned 3 tasks to user 123",
  "assigned_count": 3,
  "user_id": 123
}
```

**Frontend Logic:**
*   Allow selecting multiple tasks from the list.
*   Open a modal to select a user (from `GET /api/users`).
*   Call this endpoint to assign.
*   **Note:** This will automatically set the task status to `assigned`.

---

## 2. Unassign Tasks (Revoke Assignment)
**Endpoint:** `POST /api/tasks/unassign`

Removes assignment from tasks and resets their status to `pending`.

**Request Body:**
```json
{
  "task_ids": [101, 102]
}
```

**Response:**
```json
{
  "message": "Unassigned 2 tasks",
  "count": 2
}
```

**Frontend Logic:**
*   Add a "Unassign" or "Revoke" button for tasks that are already assigned.
*   Can be a bulk action.
*   After success, refresh the task list or update the UI to show "Pending" status and no assignee.
*   **Note:** only 'assigned' status can be unassigned. 'completed' and 'graded' status cannot be unassigned.

---

## 3. Update Task Status (Complete/Grade)
**Endpoint:** `PATCH /api/tasks/{task_id}/status`

Updates the status of a single task.

**Request Body:**
```json
{
  "status": "complete"
}
```
*   Allowed values: `pending`, `assigned`, `complete`, `graded`

**Response:**
```json
{
  "message": "Status updated",
  "task_id": 101,
  "status": "complete"
}
```

**Frontend Logic:**
*   **Complete:** When a user finishes reviewing a task, add a "Mark as Complete" or "Submit" button. Call this endpoint with `status: "complete"`.
*   **Graded:** When user "Mark as Complete" mysql trigger will grade this task and change status to `graded`.

---

## 4. Task List & Visibility
**Endpoint:** `GET /api/tasks`

*   **Assigned Tasks:** Tasks explicitly assigned to the current user will appear in their list.
*   **Scope-based Tasks:** Tasks matching the user's scope (e.g., specific Evaluation Center) will also appear.
*   **Status Filter:** You can filter by status using the query param: `GET /api/tasks?processing_status=assigned`.

## Summary of Status Flow
1.  **Pending:** Initial state.
2.  **Assigned:** Automatically set when `POST /api/tasks/assign` is called.
3.  **Complete:** User manually sets this after review.
4.  **Graded:** Final state automatically set MySQL trigger.
