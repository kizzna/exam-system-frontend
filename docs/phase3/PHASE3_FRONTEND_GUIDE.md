# Phase 3 Frontend Implementation Guide: Task Management & RBAC

## Overview
This guide covers the implementation of the Task Management system and the new **Scope-Based Authorization Model**. The system replaces rigid hierarchy levels with flexible scopes to determine user access and visibility.

## 1. Authentication & User Profile
The `GET /api/auth/me` (and login response) now includes a `scopes` array.

### TypeScript Interfaces
```typescript
interface User {
  user_id: number;
  username: string;
  is_admin: boolean;
  // ... other fields
  scopes: UserScope[];
}

interface UserScope {
  scope_type: 'global' | 'eval_center' | 'snr_authority';
  scope_id: number;
  filters: ScopeFilter;
}

interface ScopeFilter {
  class_levels?: number[];
  exam_centers?: {
    include_list?: number[];
    include_ranges?: { start: number; end: number }[];
  };
  snr_id_list?: number[];
}
```

### Authorization Logic
- **Global Admin**: If `user.is_admin` is true OR `scopes` contains a `global` type scope:
    - Show **ALL** controls.
    - Enable all filters.
- **Evaluation Center User** (`scope_type: 'eval_center'`):
    - **Context**: User belongs to a specific Evaluation Center (`scope_id`).
    - **UI**: Pre-select/Lock "Evaluation Center" dropdown.
    - **Class Level Filter**: Only show/enable checkboxes for `filters.class_levels`.
    - **Exam Center Filter**: Restrict autocomplete/selection to `filters.exam_centers`.
- **SNR Authority** (`scope_type: 'snr_authority'`):
    - **Context**: User manages a Temple Network (SNR).
    - **UI**: Pre-select/Lock "SNR" dropdown.

## 2. Task Management API

### List Tasks
**GET** `/api/tasks/`

Fetches tasks visible to the current user. The backend automatically applies scope constraints.

**Query Parameters:**
- `eval_center_id` (int, optional)
- `processing_status` (string, optional): `pending`, `assigned`, `complete`, `graded`, `exported`
- `class_level` (int, optional)
- `exam_center_code` (int, optional)
- `hon_id` (int, optional)
- `parent_part_id` (int, optional)
- `ss_snr_id` (int, optional)

**Response:**
```json
[
  {
    "id": 101,
    "task_id": 20100111,
    "exam_center_code": 201001,
    "class_group": 1,
    "class_level": 1,
    "eval_center_id": 25,
    "processing_status": "pending",
    "registered_amount": 100,
    "present_amount": 95,
    "actual_sheet_count": 0,
    "assigned_user_id": null,
    "error_count": 0,
    "created_at": "2025-11-25T10:00:00Z",
    "access_source": "center_role",
    "user_role": "admin"
  }
]
```

### Assign Tasks (Admin Only)
**POST** `/api/tasks/assign`

Assigns tasks to a user.

**Request Body:**
```json
{
  "user_id": 123,
  "permission_level": "upload", // "view", "upload", "manage"
  
  // Filter criteria (assign ALL matching these filters)
  "eval_center_id": 25,
  "class_level": 1,
  
  // OR Explicit IDs
  "task_ids": [101, 102, 103]
}
```

## 3. UI Requirements

### Task Dashboard
- **Grid/Table View**: Display tasks with columns for ID, Center, Class, Status, Progress.
- **Filters**: 
    - **Eval Center**: Dropdown (Locked if user has `eval_center` scope).
    - **Status**: Dropdown.
    - **Class Level**: Checkboxes (Restricted if user has `class_levels` filter).
- **Status Badges**: Color-coded badges for `processing_status`.

### Assignment Modal (Admin Only)
- **Trigger**: "Assign Tasks" button.
- **User Selection**: Dropdown to select a user.
- **Scope Selection**: "Selected Tasks" or "All Tasks in Filter".
- **Permission**: Radio buttons for View/Upload/Manage.

### My Tasks (Staff View)
- Simplified view showing only tasks assigned to the logged-in user.
- Action buttons enabled based on `permission_level`.

### User Management (Admin)
**Create New User Form Update**:
- **Assign to Evaluation Center**: Dropdown (fetch from `/api/evaluation-centers`).
- **Role**: Dropdown (`admin`, `staff`, `viewer`).
- **Note**: Backend refactoring deprecated `hierarchy_level`. Use `user_scopes` for assigning context.

## 4. Master Data (Dropdowns)
- **Head of Order (Hon)**: `GET /api/master-data/hons`
- **Part**: `GET /api/master-data/parts?hon_id={selected_hon_id}`
- **SNR**: `GET /api/master-data/snrs?parent_part_id={selected_part_id}`

## 5. Migration Checklist
- [ ] Update TypeScript interfaces for `User` and `UserScope`.
- [ ] Update "My Profile" or "Context Switcher" components to display current scope.
- [ ] Refactor "Task Filter" component to respect `user.scopes` constraints.
- [ ] Remove logic relying on `user.hierarchy_level`.
