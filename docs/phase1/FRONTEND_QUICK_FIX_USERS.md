# Frontend Quick Fix: Users Edit/Delete

**Issue:** Users list shows data but Edit and Delete buttons don't work  
**Root Cause:** Missing frontend implementation (API is working fine)  
**Solution:** Add these functions to your users page

---

## TypeScript Types (Add to types.ts)

```typescript
// User types
export interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  hierarchy_level: 'global' | 'order' | 'region' | 'part' | 'organization';
  hierarchy_id: number | null;
  last_login_at: string | null;
  login_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  is_active?: boolean;
  is_admin?: boolean;
  hierarchy_level?: string;
  hierarchy_id?: number | null;
}
```

---

## API Service Functions (Add to services/api.ts)

```typescript
// Get auth token from storage
function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

// Update user
export async function updateUser(
  userId: number, 
  updates: UserUpdate
): Promise<User> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Update failed');
  }

  return await response.json();
}

// Delete user (soft delete)
export async function deleteUser(userId: number): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Delete failed');
  }

  // Success - 204 No Content (no response body)
}
```

---

## React Component Example (Edit Modal)

```typescript
'use client';

import { useState } from 'react';
import { updateUser } from '@/services/api';
import type { User, UserUpdate } from '@/types';

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserModal({ 
  user, 
  isOpen, 
  onClose, 
  onSuccess 
}: EditUserModalProps) {
  const [formData, setFormData] = useState<UserUpdate>({
    full_name: user.full_name,
    email: user.email,
    is_active: user.is_active,
    is_admin: user.is_admin
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateUser(user.user_id, formData);
      onSuccess(); // Refresh user list
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Edit User</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name || ''}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              id="is_active"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Active
            </label>
          </div>

          {/* Admin Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_admin}
              onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
              id="is_admin"
            />
            <label htmlFor="is_admin" className="text-sm font-medium">
              Administrator
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## React Component Example (Delete Confirmation)

```typescript
'use client';

import { useState } from 'react';
import { deleteUser } from '@/services/api';
import type { User } from '@/types';

interface DeleteUserButtonProps {
  user: User;
  onSuccess: () => void;
}

export function DeleteUserButton({ user, onSuccess }: DeleteUserButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await deleteUser(user.user_id);
      onSuccess(); // Refresh user list
      setShowConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:underline text-sm"
      >
        Delete
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete user <strong>{user.username}</strong>?
              This will deactivate their account.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

## Usage in Users List Page

```typescript
'use client';

import { useState, useEffect } from 'react';
import { EditUserModal } from '@/components/EditUserModal';
import { DeleteUserButton } from '@/components/DeleteUserButton';
import type { User } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch users from API
  const fetchUsers = async () => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users?page=1&page_size=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const data = await response.json();
    setUsers(data.users);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSuccess = () => {
    fetchUsers(); // Refresh list after edit/delete
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Username</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Full Name</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id} className="border-t">
              <td className="p-2">{user.user_id}</td>
              <td className="p-2">{user.username}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.full_name}</td>
              <td className="p-2">
                <span className={user.is_active ? 'text-green-600' : 'text-gray-400'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Edit
                </button>
                <DeleteUserButton 
                  user={user} 
                  onSuccess={handleSuccess}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
```

---

## Environment Variables

Make sure `.env.local` has:

```bash
NEXT_PUBLIC_API_URL=http://gt-omr-api-1:8000
```

---

## Testing Checklist

After implementing:

- [ ] Click Edit button → Modal opens with user data pre-filled
- [ ] Change full name → Click Save → User list refreshes with new name
- [ ] Toggle Active checkbox → Click Save → User status updates
- [ ] Click Delete → Confirmation modal appears
- [ ] Confirm delete → User becomes inactive (is_active = false)
- [ ] Deleted user shows "Inactive" status in list

---

## Common Mistakes to Avoid

1. ❌ **Wrong HTTP Method**
   ```typescript
   method: 'PUT'  // Wrong!
   ```
   ✅ **Correct:**
   ```typescript
   method: 'PATCH'  // Right!
   ```

2. ❌ **Missing Bearer Prefix**
   ```typescript
   'Authorization': token  // Wrong!
   ```
   ✅ **Correct:**
   ```typescript
   'Authorization': `Bearer ${token}`  // Right!
   ```

3. ❌ **Parsing DELETE Response**
   ```typescript
   const data = await response.json();  // Wrong! (204 has no body)
   ```
   ✅ **Correct:**
   ```typescript
   if (response.status === 204) {
     // Success - no response body
   }
   ```

4. ❌ **Not Refreshing List**
   ```typescript
   await deleteUser(id);
   // List still shows old data
   ```
   ✅ **Correct:**
   ```typescript
   await deleteUser(id);
   fetchUsers();  // Refresh!
   ```

---

## Quick Test

After implementation, test in browser console:

```javascript
// Test update
const token = localStorage.getItem('access_token');
fetch('http://gt-omr-api-1:8000/api/users/7', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ full_name: 'Console Test' })
})
.then(r => r.json())
.then(console.log);

// Test delete
fetch('http://gt-omr-api-1:8000/api/users/6', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => console.log('Status:', r.status));
```

Expected:
- Update returns user object with `full_name: "Console Test"`
- Delete returns `Status: 204`

---

## Need Help?

If still not working after implementing this:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click Edit or Delete button
4. Find the API request
5. Check:
   - Request URL (should be `/api/users/{id}`)
   - Request Method (PATCH or DELETE)
   - Request Headers (Authorization header present?)
   - Response Status (200/204 = success, 401/403 = auth issue)
   - Response Body (error message if failed)

Share this info with backend team for debugging.
