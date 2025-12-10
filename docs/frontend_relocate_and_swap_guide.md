# Frontend Guide: Sheet Relocate & Swap

This guide details how to implement the "Move to Task" (Relocate) and "Swap Tasks" features.

## 1. Sheet Relocate (Move to Task)

Use this when **specific sheets** were scanned into the wrong task and need to be moved to another task.

### Endpoint
`POST /sheets/relocate`

### Payload
```json
{
  "sheet_ids": [123, 124, 125],
  "source_task_id": 14900113,
  "target_task_id": 14900221,
  "target_class_level": 2,
  "target_class_group": 1
}
```

### Frontend Implementation
1.  **Selection**: Allow user to select one or multiple sheets.
2.  **Target Selection**:
    *   Show a dialog to pick the target Task. 
    *   **Search Implementation**: Use `GET /tasks` to search for target tasks.
        *   **Important**: The API automatically filters tasks based on the user's ABAC permissions. You do not need to filter manually.
        *   **Pagination**: Use `size=50` to handle long lists efficiently for users with massive access.
        *   Example: `GET /tasks?task_id=101&size=50` (search by ID prefix).
    *   The user must allow selecting target task to move to with mouse or with keyboard arrow navigation and enter key.
3.  **Submit**: Send the payload.
4.  **Refresh**: On success, remove the moved sheets from the current view.

> [!NOTE]
> The backend automatically handles score re-calculation. If the target task has a different Class Level or Group, the score will be forced to re-calculate.

---

## 2. Task Swap (Swap All Sheets)

Use this when **ALL sheets** in Task A belong to Task B, and ALL sheets in Task B belong to Task A (i.e., the tasks were physically swapped during scanning).

### Endpoint
`POST /sheets/swap`

### Payload
```json
{
  "task_id_a": 14900113,
  "task_id_b": 14900221
}
```

### Frontend Implementation
1.  **Entry Point**: This should likely be an Admin or Advanced action (e.g., "Fix Swapped Tasks" button).
2.  **Input**: Ask for the two Task IDs to swap.
    *   **Recommendation**: Use the same `GET /tasks` search component (as in Relocate) to allow selecting tasks from the authorized list.
3.  **Confirmation**: Show a confirmation dialog explaining that *ALL* sheets will be swapped between the two tasks.
4.  **Submit**: Send the payload.
5.  **Refresh**: Reload the task views.

> [!IMPORTANT]
> **Score Recalculation**:
> The backend checks the Task IDs. If the **last 2 digits** (representing Level and Group) differ, the system will **automatically force a full re-score** of all swapped sheets.
> - Example 1: `14900811` (P.1/1) <-> `14901211` (P.5/1). Last digits `11` vs `11`. **No re-score** (Source/Target keys match).
> - Example 2: `14900113` (P.1/3) <-> `14900221` (P.2/1). Last digits `13` vs `21`. **Force Re-score** rules applied.

### Notes:
This is information what is returned from api.
Result is correct according to what permission test04 has.
as user with limited access, test04.

Task list request:
Request URL
http://gt-omr-api-1.gt:8000/tasks/?page=1&size=50&sort_by=error_count&sort_order=desc
Payload:
page
1
size
50
sort_by
error_count
sort_order
desc
Response:
{
    "items": [
        {
            "task_id": 11600132,
            "exam_center_code": 116001,
            "class_group": 2,
            "class_level": 3,
            "eval_center_id": 1,
            "processing_status": "pending",
            "registered_amount": 2,
            "present_amount": 2,
            "actual_sheet_count": 2,
            "assigned_user_id": null,
            "error_count": 0,
            "created_at": "2025-11-15T19:15:06",
            "latest_batch_id": 10641,
            "err_duplicate_sheets_count": 0,
            "err_low_answer_count": 0,
            "err_student_id_count": 0,
            "err_exam_center_id_count": 0,
            "err_class_group_count": 0,
            "err_class_level_count": 0,
            "err_absent_count": 0,
            "trash_count": 0,
            "access_source": null,
            "user_role": null,
            "review_results": 0
        },
/* ... */
    ],
    "total": 63,
    "page": 1,
    "size": 50,
    "pages": 2
}

## Summary of Logic

| Feature | Use Case | Force Re-score Logic |
| :--- | :--- | :--- |
| **Relocate** | Moving specific sheets (Case 2) | **Auto**: Checks if Source Task Suffix != Target Task Suffix |
| **Swap** | Swapping entire tasks (Case 1) | **Auto**: Checks if Task A Suffix != Task B Suffix |
| **Edit Answer** | Manual correction | **Always** |
