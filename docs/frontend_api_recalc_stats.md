# Task Statistics Recalculation API

## Endpoint: Recalculate Task Statistics
Trigger a recalculation of statistics for specific tasks. This is useful when manual DB operations or batch deletions have occurred that might have left the aggregated statistics in `processing_tasks` out of sync with the `omr_sheets` data.

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
