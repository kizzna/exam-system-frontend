# Add recalculate task statistics (evaluation center level and task level feature)

## recalculate task statistics (evaluation center level)
Method: POST
URL: /tasks/recalculate-batch
Body: 
RecalculateBatchStatsRequest
 (inherits from TaskFilter)
Permissions: Super Admin only.

### Example Request
curl -X 'POST' \
  'http://localhost:8000/tasks/recalculate-batch' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "eval_center_id": 619
}'
Expected Response
{
  "tasks_found": 1500,
  "tasks_recalculated": 1500,
  "status": "Success"
}

### button location on task list page
- It should be placed after drop down section of evaluation center: กองงานตรวจใบตอบ

### behavior
- It should be activated only if Evaluation Center is selected
- selected eval_center_id should be sent to the backend
- Only available for user with is_admin = true
- Prompt for confirmation before recalculation
- Button text: "คำนวณสถิติใหม่"

## recalculate task statistics (task level)
Trigger a recalculation of statistics for specific tasks. This is useful when manual DB operations or batch deletions have occurred that might have left the task statistics in `processing_tasks` out of sync with the `omr_sheets` data.

### URL
`POST /tasks/recalculate-task-statistics`

### Authentication
- Requires Bearer Token
- **Super Admin** privileges required

### Body Parameters
| Field | Type | Description |
| :--- | :--- | :--- |
| `task_ids` | `List[int]` | Array of Task IDs to recalculate |

### Request Example
```json
{
    "task_ids": [1001, 1002, 1003]
}
```

### Response Example
```json
{
    "tasks_recalculated": 3,
    "status": "Success"
}
```

### Error Responses
- `403 Forbidden`: User is not a Super Admin.
- `422 Validation Error`: Invalid request body format.

### button location on task list page
- It should be placed after advanced filter "ตัวกรองอื่นๆ"
- Activated if at least one task is selected
- Prompt for confirmation before recalculation
- Button text: "คำนวณสถิติใหม่"
- Available to all users who can see this list (list already applied permission filters, user can only see what they are allowed to see)

