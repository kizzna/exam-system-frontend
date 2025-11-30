# Frontend Implementation Guide: ABAC Model

This guide explains how to implement the Attribute-Based Access Control (ABAC) model on the frontend, specifically for User Management and Task Assignment.

## 1. User Management (Create/Edit User)

The `POST /api/users` (Create) and `PATCH /api/users/{id}` (Update) endpoints accept a [scopes](file:///workspaces/omr-backend/src/domains/users/repository.py#266-290) array. This allows you to define granular permissions for a user.

### Data Structure

Each scope object in the [scopes](file:///workspaces/omr-backend/src/domains/users/repository.py#266-290) array should follow this structure:

```typescript
interface ScopeFilter {
  class_levels?: number[];           // e.g., [1, 2, 3]
  exam_centers_include?: number[];   // e.g., [101, 102]
  exam_centers_ranges?: {            // e.g., [{start: 100, end: 200}]
    start: number;
    end: number;
  }[];
  snr_id_list?: number[];            // e.g., [149]
  task_id_list?: number[];           // e.g., [1001, 1002] (New!)
}

interface UserScope {
  scope_type: 'global' | 'eval_center' | 'snr_authority';
  scope_id: number;
  filters?: ScopeFilter;
}

interface UserPayload {
  // ... other user fields (username, email, etc.)
  scopes?: UserScope[];
}
```

### Example Payload

```json
{
  "username": "staff_user",
  "email": "staff@example.com",
  "password": "securepassword",
  "scopes": [
    {
      "scope_type": "eval_center",
      "scope_id": 619,
      "filters": {
        "class_levels": [1, 2],
        "snr_id_list": [149]
      }
    },
    {
      "scope_type": "global",
      "scope_id": 0,
      "filters": {
        "task_id_list": [5001, 5002]
      }
    }
  ]
}
```

### Frontend Implementation Tips
- **Scope Type Selector**: Dropdown with options "Evaluation Center", "SNR Authority", "Global".
- **Scope ID Input**:
    - If "Evaluation Center" selected -> Show Evaluation Center dropdown/search.
    - If "SNR Authority" selected -> Show SNR dropdown/search.
    - If "Global" selected -> Hide Scope ID (send 0).
- **Filters**:
    - **Class Levels**: Multi-select checkbox (as seen in your form).
    - **Task IDs**: If you want to assign specific tasks here, allow entering IDs. (Though usually done via "Assign Tasks" page).

---

## 2. Task Assignment (Assign Tasks Page)

The `POST /api/tasks/assign` endpoint has been updated to use the ABAC model. When you assign tasks, the backend now creates a [user_scope](file:///workspaces/omr-backend/src/domains/auth/repository.py#243-271) for the user.

### Scenario A: Assign All Tasks in Filter
When the user selects "All Tasks in Current Filter", send the filter criteria.

**Payload:**
```json
{
  "user_id": 123,
  "permission_level": "upload",
  "eval_center_id": 100,
  "class_level": 5
  // task_ids is OMITTED
}
```
**Backend Action:** Creates a scope: `scope_type='eval_center'`, `scope_id=100`, `filters={'class_level': 5}`.

### Scenario B: Assign Specific Tasks
When the user selects specific tasks (checkboxes).

**Payload:**
```json
{
  "user_id": 123,
  "permission_level": "upload",
  "task_ids": [101, 102, 103]
}
```
**Backend Action:** Creates a scope: `scope_type='global'`, `scope_id=0`, `filters={'task_id_list': [101, 102, 103]}`.

## Summary
- **Existing User API**: Fully supports ABAC. You just need to construct the [scopes](file:///workspaces/omr-backend/src/domains/users/repository.py#266-290) JSON array correctly in the payload.
- **Assign Tasks API**: Automatically handles scope creation based on your request. No changes needed on frontend if you are already sending filters or task IDs correctly.
