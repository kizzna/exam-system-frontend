# Phase 1 Frontend Development Guide

**Backend Phase:** Phase 1 - Foundation & Auth (Complete ✅)  
**Frontend Stack:** Next.js 15 LTS (React 18/19)  
**Date:** November 17, 2025  
**Status:** Ready for Frontend Implementation

---

## Overview

This guide provides complete specifications for implementing the **Authentication and User Management** features in the Next.js 15 frontend. All backend endpoints are deployed and tested on production server (gt-omr-api-1).

### What's Included in Phase 1

1. **Authentication System** - Login, JWT tokens, session management
2. **User Management** - CRUD operations, role assignment (Admin only)

### Frontend Implementation Priority

1. **Week 1:** Authentication (Login, Logout, Protected Routes)
2. **Week 2:** User Management UI (Admin Dashboard)

---

## Base URL & Environment

### API Base URL

```env
# .env.local
NEXT_PUBLIC_API_URL=http://gt-omr-api-1:8000
```

### API Documentation

- **Swagger UI:** http://gt-omr-api-1:8000/docs
- **ReDoc:** http://gt-omr-api-1:8000/redoc

---

## 1. Authentication Domain

### 1.1 Login Endpoint

**Endpoint:** `POST /api/auth/login`

**Request:**
```typescript
interface LoginRequest {
  username: string;  // 3-50 characters
  password: string;  // minimum 8 characters
}
```

**Response (Success - 200):**
```typescript
interface TokenResponse {
  access_token: string;   // JWT token, expires in 30 minutes
  refresh_token: string;  // JWT token, expires in 7 days
  token_type: "bearer";
  user: {
    user_id: number;
    username: string;
    email: string;
    full_name: string;
    is_admin: boolean;
    role_hierarchy: number;  // 0=global admin, 1=order, 2=region, 3=org
  };
}
```

**Response (Error - 401):**
```typescript
interface ErrorResponse {
  error: "HTTPException";
  message: "Invalid username or password";
  status_code: 401;
  path: "/api/auth/login";
}
```

**Example Request:**
```typescript
const response = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const data: TokenResponse = await response.json();
```

---

### 1.2 Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:**
```typescript
Authorization: Bearer {access_token}
```

**Response (200):**
```typescript
interface UserInfo {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  role_hierarchy: number;
  school_id: number | null;
  class_id: number | null;
}
```

**Example Request:**
```typescript
const response = await fetch(`${API_URL}/api/auth/me`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const user: UserInfo = await response.json();
```

---

### 1.3 Verify Token

**Endpoint:** `GET /api/auth/verify`

**Headers:**
```typescript
Authorization: Bearer {access_token}
```

**Response (200):**
```typescript
interface TokenVerification {
  valid: boolean;
  user_id: number;
  username: string;
  exp: number;  // Unix timestamp
}
```

---

### 1.4 Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Request:**
```typescript
interface RefreshRequest {
  refresh_token: string;
}
```

**Response (200):**
```typescript
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: UserInfo;
}
```

---

## 2. User Management Domain (Admin Only)

### 2.1 List Users (Paginated)

**Endpoint:** `GET /api/users`

**Query Parameters:**
```typescript
interface UserListParams {
  page?: number;        // Default: 1
  page_size?: number;   // Default: 50, Max: 100
  is_active?: boolean;  // Optional filter
}
```

**Headers:**
```typescript
Authorization: Bearer {access_token}  // Must be admin
```

**Response (200):**
```typescript
interface UserListResponse {
  users: UserResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface UserResponse {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  hierarchy_level: "global" | "order" | "region" | "organization";
  hierarchy_id: number | null;
  last_login_at: string | null;  // ISO 8601 datetime
  login_count: number;
  created_at: string;  // ISO 8601 datetime
  updated_at: string;  // ISO 8601 datetime
}
```

**Example Request:**
```typescript
const response = await fetch(
  `${API_URL}/api/users?page=1&page_size=20&is_active=true`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

const data: UserListResponse = await response.json();
```

---

### 2.2 Create User

**Endpoint:** `POST /api/users`

**Headers:**
```typescript
Authorization: Bearer {access_token}  // Must be admin
Content-Type: application/json
```

**Request:**
```typescript
interface UserCreate {
  username: string;          // 3-50 chars, unique
  email: string;             // Valid email, unique
  password: string;          // Min 8 chars
  full_name: string;         // 1-100 chars
  school_id?: number | null;
  class_id?: number | null;
  role_hierarchy: number;    // 0-3 (0=global, 1=order, 2=region, 3=org)
}
```

**Response (201):**
```typescript
UserResponse  // Same structure as above
```

**Validation Errors (422):**
```typescript
interface ValidationError {
  error: "ValidationError";
  message: string;  // e.g., "Username already exists"
  status_code: 422;
  path: "/api/users";
}
```

**Example Request:**
```typescript
const response = await fetch(`${API_URL}/api/users`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'john.doe',
    email: 'john.doe@school.edu',
    password: 'SecurePass123!',
    full_name: 'John Doe',
    school_id: 1,
    class_id: 101,
    role_hierarchy: 3  // Organization level
  })
});

const user: UserResponse = await response.json();
```

---

### 2.3 Get User Details

**Endpoint:** `GET /api/users/{user_id}`

**Headers:**
```typescript
Authorization: Bearer {access_token}  // Must be admin
```

**Response (200):**
```typescript
UserResponse
```

**Response (404):**
```typescript
interface NotFoundError {
  error: "EntityNotFoundError";
  message: "User not found";
  status_code: 404;
  path: "/api/users/{id}";
}
```

---

### 2.4 Update User

**Endpoint:** `PATCH /api/users/{user_id}`

**Headers:**
```typescript
Authorization: Bearer {access_token}  // Must be admin
Content-Type: application/json
```

**Request (Partial Updates):**
```typescript
interface UserUpdate {
  email?: string;
  full_name?: string;
  school_id?: number | null;
  class_id?: number | null;
  role_hierarchy?: number;
}
```

**Response (200):**
```typescript
UserResponse
```

**Example Request:**
```typescript
const response = await fetch(`${API_URL}/api/users/5`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'John M. Doe',
    email: 'john.m.doe@school.edu'
  })
});

const updatedUser: UserResponse = await response.json();
```

---

### 2.5 Delete User (Soft Delete)

**Endpoint:** `DELETE /api/users/{user_id}`

**Headers:**
```typescript
Authorization: Bearer {access_token}  // Must be admin
```

**Response (200):**
```typescript
interface DeleteResponse {
  success: boolean;
  message: string;  // "User deleted successfully"
}
```

**Note:** This is a soft delete - sets `is_active = false`

---

### 2.6 Change User Password (Admin Action)

**Endpoint:** `POST /api/users/{user_id}/password`

**Headers:**
```typescript
Authorization: Bearer {access_token}  // Must be admin
Content-Type: application/json
```

**Request:**
```typescript
interface PasswordChange {
  new_password: string;  // Min 8 characters
}
```

**Response (200):**
```typescript
interface PasswordChangeResponse {
  message: "Password changed successfully";
}
```

---

### 2.7 Get User Roles

**Endpoint:** `GET /api/users/{user_id}/roles`

**Headers:**
```typescript
Authorization: Bearer {access_token}  // Must be admin
```

**Response (200):**
```typescript
interface UserRoleResponse {
  user_id: number;
  username: string;
  roles: RoleResponse[];
}

interface RoleResponse {
  role_id: number;
  role_name: string;
  description: string;
  permissions: string[];  // e.g., ["*"] for admin
}
```

---

### 2.8 List Available Roles

**Endpoint:** `GET /api/users/roles/available`

**Headers:**
```typescript
Authorization: Bearer {access_token}  // Must be admin
```

**Response (200):**
```typescript
RoleResponse[]  // Array of all available roles
```

**Example Response:**
```json
[
  {
    "role_id": 1,
    "role_name": "admin",
    "description": "System Administrator",
    "permissions": ["*"]
  }
]
```

---

### 2.9 Assign Role to User

**Endpoint:** `POST /api/users/{user_id}/roles`

**Headers:**
```typescript
Authorization: Bearer {access_token}  // Must be admin
Content-Type: application/json
```

**Request:**
```typescript
interface RoleAssignment {
  role_id: number;
}
```

**Response (200):**
```typescript
UserRoleResponse  // Updated roles list
```

---

### 2.10 Remove Role from User

**Endpoint:** `DELETE /api/users/{user_id}/roles/{role_id}`

**Headers:**
```typescript
Authorization: Bearer {access_token}  // Must be admin
```

**Response (200):**
```typescript
UserRoleResponse  // Updated roles list
```

---

## 3. Frontend Implementation Guide

### 3.1 Authentication Flow

#### Step 1: Login Form Component

```tsx
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        setError(error.message);
        return;
      }

      const data = await response.json();
      
      // Store tokens (consider using httpOnly cookies for production)
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.is_admin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {error}
          </div>
        )}
        
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded"
          required
        />
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
```

#### Step 2: Auth Context Provider

```tsx
// lib/auth-context.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  role_hierarchy: number;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.is_admin ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### Step 3: Protected Route Middleware

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Additional admin check needed - verify with backend
  }

  // Protect user routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
```

#### Step 4: API Client with Token Refresh

```typescript
// lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  
  return data.access_token;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = localStorage.getItem('access_token');

  const makeRequest = async (accessToken: string) => {
    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  };

  let response = await makeRequest(token!);

  // If 401, try to refresh token
  if (response.status === 401) {
    try {
      token = await refreshAccessToken();
      response = await makeRequest(token);
    } catch {
      // Refresh failed, redirect to login
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}
```

---

### 3.2 User Management UI (Admin)

#### User List Component

```tsx
// app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';

interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function UsersPage() {
  const [data, setData] = useState<UserListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await apiRequest<UserListResponse>(
        `/api/users?page=${page}&page_size=20`
      );
      setData(response);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Username</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Full Name</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Admin</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((user) => (
            <tr key={user.user_id} className="border-t">
              <td className="p-2">{user.user_id}</td>
              <td className="p-2">{user.username}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.full_name}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="p-2">{user.is_admin ? 'Yes' : 'No'}</td>
              <td className="p-2">
                <button className="text-blue-600 hover:underline">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-between items-center">
        <div>
          Showing {data.users.length} of {data.total} users
        </div>
        <div className="space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {page} of {data.total_pages}</span>
          <button
            onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
            disabled={page === data.total_pages}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. TypeScript Types Package

Create a shared types package for consistency:

```typescript
// types/api.ts

// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: UserInfo;
}

export interface UserInfo {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  role_hierarchy: number;
  school_id?: number | null;
  class_id?: number | null;
}

// User Management Types
export interface UserResponse {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  hierarchy_level: "global" | "order" | "region" | "organization";
  hierarchy_id: number | null;
  last_login_at: string | null;
  login_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  users: UserResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name: string;
  school_id?: number | null;
  class_id?: number | null;
  role_hierarchy: number;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  school_id?: number | null;
  class_id?: number | null;
  role_hierarchy?: number;
}

export interface RoleResponse {
  role_id: number;
  role_name: string;
  description: string;
  permissions: string[];
}

export interface UserRoleResponse {
  user_id: number;
  username: string;
  roles: RoleResponse[];
}

// Error Types
export interface APIError {
  error: string;
  message: string;
  status_code: number;
  path: string;
}
```

---

## 5. Testing Checklist

### Authentication Testing

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should show error)
- [ ] Token stored in localStorage/cookies
- [ ] Redirect to dashboard after login
- [ ] Redirect based on user role (admin vs regular user)
- [ ] Protected routes redirect to login when not authenticated
- [ ] Token refresh works when access token expires
- [ ] Logout clears tokens and redirects to login

### User Management Testing (Admin)

- [ ] List all users with pagination
- [ ] Filter users by active status
- [ ] Create new user with valid data
- [ ] Create user validation errors display correctly
- [ ] Edit user details
- [ ] Change user password (admin action)
- [ ] Soft delete user
- [ ] View user roles
- [ ] Assign role to user
- [ ] Remove role from user
- [ ] List available roles

---

## 6. Security Best Practices

### Token Storage

**Recommended (Production):**
- Use httpOnly cookies for tokens
- Set secure flag in production
- Implement CSRF protection

**Development (Acceptable):**
- localStorage for quick development
- Remember to migrate to cookies before production

### API Calls

```typescript
// Always use HTTPS in production
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.example.com'
  : 'http://gt-omr-api-1:8000';
```

### Password Validation

```typescript
// Client-side validation
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain number';
  }
  return null;
};
```

---

## 7. Next Steps

### After Phase 1 Frontend Implementation

Once authentication and user management are complete, you'll be ready for:

**Phase 2 Frontend:** Batch Upload UI
- File upload with drag-and-drop
- Upload strategy selection
- Batch status monitoring
- Real-time progress updates

**Phase 3 Frontend:** Task Management
- Task list and filtering
- Task assignment interface
- Admin dashboard

---

## 8. Support & Resources

### Backend API

- **Base URL:** http://gt-omr-api-1:8000
- **API Docs:** http://gt-omr-api-1:8000/docs
- **Health Check:** http://gt-omr-api-1:8000/health

### Test Credentials

```
Username: admin
Password: admin123
Role: Global Administrator (full access)
```

### Contact

For backend API questions or issues:
- Check API documentation at `/docs`
- Review `PHASE1_COMPLETE.md` for implementation details
- All endpoints are tested and production-ready

---

## 9. Example Project Structure

```
omr-frontend/
├── app/
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── admin/
│   │   ├── layout.tsx            # Admin layout with navigation
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Admin dashboard
│   │   └── users/
│   │       ├── page.tsx          # User list
│   │       ├── [id]/
│   │       │   └── page.tsx      # User details/edit
│   │       └── new/
│   │           └── page.tsx      # Create user
│   └── dashboard/
│       └── page.tsx              # Regular user dashboard
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── ProtectedRoute.tsx
│   └── users/
│       ├── UserList.tsx
│       ├── UserForm.tsx
│       └── RoleSelector.tsx
├── lib/
│   ├── api-client.ts            # Centralized API client
│   ├── auth-context.tsx         # Auth context provider
│   └── types.ts                 # TypeScript types
├── middleware.ts                # Route protection
└── .env.local                   # Environment variables
```

---

## Conclusion

This guide provides everything needed to implement Phase 1 features in the Next.js 15 frontend. All backend endpoints are tested and ready for integration.

**Ready for Development:** ✅  
**Backend Status:** Production-ready  
**Estimated Frontend Effort:** 1-2 weeks  

Happy coding! 🚀
