# Walkthrough - processing_tasks review_results Update

I have successfully updated the backend to support the [review_results](file:///workspaces/omr-backend/src/domains/tasks/service.py#142-145) bitmask column in the `processing_tasks` table.

## Changes

### 1. Database Model
- **[src/domains/tasks/models.py](file:///workspaces/omr-backend/src/domains/tasks/models.py)**: Added [review_results](file:///workspaces/omr-backend/src/domains/tasks/service.py#142-145) (int) to the [Task](file:///workspaces/omr-backend/src/domains/tasks/models.py#5-66) dataclass.

### 2. Schemas
- **[src/domains/tasks/schemas.py](file:///workspaces/omr-backend/src/domains/tasks/schemas.py)**:
    - Added [review_results](file:///workspaces/omr-backend/src/domains/tasks/service.py#142-145) to [TaskResponse](file:///workspaces/omr-backend/src/domains/tasks/schemas.py#19-48).
    - Added [review_results](file:///workspaces/omr-backend/src/domains/tasks/service.py#142-145) to [TaskFilter](file:///workspaces/omr-backend/src/domains/tasks/schemas.py#49-72).
    - Created [UpdateReviewResultsRequest](file:///workspaces/omr-backend/src/domains/tasks/schemas.py#89-91) for the update endpoint.

### 3. Repository & Service
- **[src/domains/tasks/repository.py](file:///workspaces/omr-backend/src/domains/tasks/repository.py)**:
    - Updated [find_all](file:///workspaces/omr-backend/src/domains/tasks/repository.py#14-59) to include [review_results](file:///workspaces/omr-backend/src/domains/tasks/service.py#142-145) in the query and support filtering by it (exact match).
    - Added [update_review_results(task_id, review_results)](file:///workspaces/omr-backend/src/domains/tasks/service.py#142-145) method.
- **[src/domains/tasks/service.py](file:///workspaces/omr-backend/src/domains/tasks/service.py)**:
    - Exposed [update_review_results](file:///workspaces/omr-backend/src/domains/tasks/service.py#142-145) method.

### 4. API Router
- **[src/api/routers/tasks.py](file:///workspaces/omr-backend/src/api/routers/tasks.py)**:
    - Updated `GET /tasks` to support [review_results](file:///workspaces/omr-backend/src/domains/tasks/service.py#142-145) filtering.
    - Updated `GET /tasks/stats` to support new filters.
    - Added `PATCH /tasks/{task_id}/review-results` endpoint.

## Verification Results

### Static Analysis
A verification script [verify_review_results.py](file:///workspaces/omr-backend/verify_review_results.py) was executed to ensure:
- All modified modules can be imported without errors.
- [Task](file:///workspaces/omr-backend/src/domains/tasks/models.py#5-66) model accepts the new field.
- [TaskResponse](file:///workspaces/omr-backend/src/domains/tasks/schemas.py#19-48) schema validates the new field.
- [TaskRepository](file:///workspaces/omr-backend/src/domains/tasks/repository.py#6-328) and [TaskService](file:///workspaces/omr-backend/src/domains/tasks/service.py#7-219) are structurally correct.

**Result:** `SUCCESS`

## Usage

### Filtering
`GET /tasks?review_results=1` (Exact match)

### Updating
`PATCH /tasks/{id}/review-results`
Payload: `{"review_results": 5}`
