Frontend Handout: User Management Forms (RBAC & Scopes)
Overview
The User Management system has been updated to support Scope-Based Authorization. The legacy 
hierarchy_level
 dropdown should be replaced with a more flexible Scope Manager.

1. API Updates
User Object
The user object now includes a 
scopes
 array:

interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  scopes: UserScope[]; // New field
  // ... legacy fields (ignore hierarchy_level)
}
interface UserScope {
  scope_type: 'global' | 'eval_center' | 'snr_authority';
  scope_id: number;
  filters: ScopeFilter;
}
interface ScopeFilter {
  class_levels?: number[];
  exam_centers_include?: number[];
  exam_centers_ranges?: { start: number; end: number }[];
  snr_id_list?: number[];
}
Create User
POST /api/users Body:

{
  "username": "jdoe",
  "email": "jdoe@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "is_admin": false,
  "scopes": [
    {
      "scope_type": "eval_center",
      "scope_id": 25,
      "filters": {
        "class_levels": [1, 2]
      }
    }
  ]
}
Update User
PATCH /api/users/{id} Body:

{
  "full_name": "John Doe Updated",
  "scopes": [ ... new list of scopes ... ]
}
Note: Sending 
scopes
 replaces the entire list. To add a scope, fetch existing scopes, append the new one, and send the full list.

2. Form Implementation Guide
A. Create New User Form
Fields:

Username (Text)
Email (Email)
Full Name (Text)
Password (Password)
Role (Radio/Select):
Global Admin: Sets is_admin = true. Disables Scope Manager (Admins have full access).
Standard User: Sets is_admin = false. Enables Scope Manager.
Scope Manager (Dynamic Section):

Add Scope Button: Adds a new row.
Scope Row:
Type: Dropdown (Evaluation Center, SNR Authority).
Context: Dropdown (Dynamic based on Type).
If Evaluation Center: Fetch list from /api/evaluation-centers.
If SNR Authority: Fetch list from /api/master-data/snrs.
Filters (Optional): "Add Constraints" button.
Class Levels: Multi-select (1, 2, 3).
Exam Centers: Input for specific codes or ranges.
B. Edit User Form
Fields:

Email (Email)
Full Name (Text)
Active (Checkbox)
Role (Radio/Select):
Global Admin: Sets is_admin = true.
Standard User: Sets is_admin = false.
Scope Manager:

Load existing user.scopes.
Allow adding/removing/editing scopes.
Important: When saving, send the 
scopes
 array in the PATCH request.
3. Master Data for Dropdowns
Evaluation Centers: GET /api/evaluation-centers (Check if this exists, otherwise use hardcoded list for now or GET /api/master-data/eval-centers if available).
SNRs: GET /api/master-data/snrs.
4. Example Payload Construction
const handleSubmit = (formData) => {
  const payload = {
    username: formData.username,
    email: formData.email,
    password: formData.password,
    full_name: formData.full_name,
    is_admin: formData.role === 'admin',
    scopes: formData.role === 'admin' ? [] : formData.scopes.map(s => ({
      scope_type: s.type, // 'eval_center'
      scope_id: s.id,     // 25
      filters: {
        class_levels: s.classLevels // [1, 2]
      }
    }))
  };
  
  api.post('/api/users', payload);
}