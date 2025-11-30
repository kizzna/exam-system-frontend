# Frontend Migration Guide: `processing_tasks` Schema Change

## Overview
The backend schema for `processing_tasks` has been updated. The [id](file:///workspaces/omr-backend/src/domains/tasks/repository.py#9-13) column (auto-increment primary key) has been removed, and `task_id` (unique identifier) has been promoted to the Primary Key.

## Breaking Changes

### 1. Task Object Structure
The [Task](file:///workspaces/omr-backend/src/domains/tasks/models.py#5-60) object returned by API endpoints (e.g., `/tasks/`) no longer contains an [id](file:///workspaces/omr-backend/src/domains/tasks/repository.py#9-13) field. You must now use `task_id` as the unique identifier.

**Old Response:**
```json
{
  "id": 123,
  "task_id": 11600111,
  "processing_status": "pending",
  ...
}
```

**New Response:**
```json
{
  "task_id": 11600111,
  "processing_status": "pending",
  ...
}
```

### 2. API Endpoints
Any API call that previously required an [id](file:///workspaces/omr-backend/src/domains/tasks/repository.py#9-13) path parameter or body field now expects `task_id`.

- **Get Task Details**: `GET /tasks/{task_id}` (previously `GET /tasks/{id}`)
- **Update Task**: `PUT /tasks/{task_id}` (previously `PUT /tasks/{id}`)
- **Assign Tasks**: When sending a list of task IDs to assign, ensure you are sending the `task_id` values.

## Action Items for Frontend Team
1.  **Search and Replace**: Search for all references to `task.id` in the frontend codebase and replace them with `task.task_id`.
2.  **Update Types/Interfaces**: Update TypeScript interfaces (if applicable) to remove [id](file:///workspaces/omr-backend/src/domains/tasks/repository.py#9-13) and ensure `task_id` is treated as the primary key (number).
3.  **Verify Lists**: Ensure lists of tasks (e.g., DataGrid, Tables) use `task_id` as the `key` or `rowId`.
