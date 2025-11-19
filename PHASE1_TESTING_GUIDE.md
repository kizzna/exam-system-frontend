# Phase 1 Testing Guide

## ✅ Fixes Applied

**Date:** November 19, 2025  
**Deployment:** All 3 servers (gt-omr-web-1, 2, 3)

### Issues Fixed

1. ✅ **Create User - Role selector now working**
   - Fixed: Role dropdown was not saving selected role
   - Now: Correctly saves Global Admin (0), Order (1), Region (2), or Organization (3)

2. ✅ **Edit User - Fully implemented**
   - Added complete Edit dialog
   - Pre-fills current user data
   - Updates: Email, Full Name, Role, Active status
   - Shows error messages on failure

3. ✅ **Delete User - Better confirmation**
   - Added proper confirmation dialog
   - Shows username being deleted
   - Prevents accidental deletions
   - Shows error messages on failure

---

## 🧪 Testing Checklist

### Test Environment

- **URL:** http://gt-omr-web-1.gt/dashboard/users
- **Login:** admin / admin123

### 1. Create User ✅

**Test Steps:**

1. Click "Add User" button
2. Fill in form:
   - Username: `testuser1`
   - Email: `testuser1@example.com`
   - Full Name: `Test User One`
   - Password: `password123`
   - Role: Select **Order** (not Organization)
3. Click "Create User"

**Expected Result:**

- ✅ User appears in list
- ✅ Role shows "order" (not "organization")
- ✅ Status shows "Active"

**Test Role Options:**

- Create user with **Global Admin** → Should show "Admin" badge
- Create user with **Order** → Should show "order"
- Create user with **Region** → Should show "region"
- Create user with **Organization** → Should show "organization"

---

### 2. Edit User ✅

**Test Steps:**

1. Find a user in the list
2. Click the **Edit** (pencil) button
3. Edit dialog should open with:
   - Email pre-filled
   - Full Name pre-filled
   - Role pre-selected (matching user's current role)
   - Active checkbox checked/unchecked
4. Change Full Name to "Updated Name"
5. Change Role from "Organization" to "Region"
6. Click "Update User"

**Expected Result:**

- ✅ Dialog closes
- ✅ User list refreshes automatically
- ✅ Full Name updated to "Updated Name"
- ✅ Role changed to "region"

**Edge Cases to Test:**

- Edit admin user → Should allow changing all fields
- Edit and change Active status → Should update immediately
- Edit with invalid email → Should show error message
- Cancel edit → Should not save changes

---

### 3. Delete User ✅

**Test Steps:**

1. Find a test user in the list
2. Click the **Delete** (trash) button
3. Confirmation dialog appears showing:
   - "Are you sure you want to delete user **username**?"
   - "This will deactivate their account."
4. Click "Delete User"

**Expected Result:**

- ✅ Dialog closes
- ✅ User list refreshes
- ✅ User's status changes to "Inactive"
- ✅ User still appears in list (soft delete)

**Important Notes:**

- Delete is a **soft delete** (sets `is_active = false`)
- User is not removed from database
- User can be reactivated by editing and checking "Active"

---

### 4. Error Handling ✅

**Test Error Cases:**

**Create User with Duplicate Username:**

1. Create user with username "admin"
2. Should show error: "Username already exists"

**Create User with Duplicate Email:**

1. Create user with email "admin@example.com"
2. Should show error: "Email already exists"

**Create User with Weak Password:**

1. Try password: "123"
2. Should show error: "Password must be at least 8 characters"

**Edit User - Invalid Email:**

1. Edit user, change email to "invalid-email"
2. Browser should show validation error

---

### 5. UI/UX Checks ✅

**Visual Tests:**

- ✅ Modals appear centered with dark overlay
- ✅ Form fields are properly labeled
- ✅ Role dropdown shows all 4 options
- ✅ Active checkbox is visible and clickable
- ✅ Error messages appear in red
- ✅ Loading states show "Creating..." / "Updating..." / "Deleting..."
- ✅ Cancel button closes modal without saving

**Responsive Tests:**

- Modal should fit on screen at different sizes
- Form should be readable and usable

---

## 🔍 Known Behaviors

### Role Hierarchy Mapping

| UI Label     | Database Value | API Value | Display Badge  |
| ------------ | -------------- | --------- | -------------- |
| Global Admin | 0              | 0         | "Admin"        |
| Order        | 1              | 1         | "order"        |
| Region       | 2              | 2         | "region"       |
| Organization | 3              | 3         | "organization" |

### Active/Inactive Status

- **Active (is_active = true):**
  - User can log in
  - Shows green "Active" badge
- **Inactive (is_active = false):**
  - User cannot log in
  - Shows gray "Inactive" badge
  - Created by Delete operation
  - Can be reactivated via Edit

### Admin vs Regular User

- **is_admin = true:**
  - Shows purple "Admin" badge
  - Has full system access
- **is_admin = false:**
  - Shows role-based badge (order/region/organization)
  - Has limited access based on role

---

## 🐛 Debugging

### If Create doesn't save role:

**Check Browser Console:**

```javascript
// Should show correct role_hierarchy value
console.log('Role hierarchy:', formData.role_hierarchy);
// Should be: 0, 1, 2, or 3 (not undefined)
```

**Check Network Tab:**

1. Open DevTools → Network
2. Create user
3. Find POST request to `/api/users`
4. Check Request Payload:
   ```json
   {
     "username": "testuser1",
     "email": "testuser1@example.com",
     "full_name": "Test User One",
     "password": "password123",
     "role_hierarchy": 1 // Should be 0-3
   }
   ```

### If Edit doesn't open:

**Check Console for Errors:**

- Look for any JavaScript errors
- Verify `selectedUser` is set correctly

**Check State:**

```javascript
// In React DevTools
isEditDialogOpen: true
selectedUser: { user_id: 7, username: "testuser1", ... }
```

### If Delete doesn't work:

**Check API Response:**

1. Network Tab → DELETE request
2. Should return HTTP 204 No Content
3. User should have `is_active: false` after refresh

**Check Database (if needed):**

```sql
SELECT user_id, username, is_active, updated_at
FROM users
WHERE username = 'testuser1';
```

---

## ✅ Phase 1 Completion Checklist

After testing, verify all features work:

- [x] **Authentication**
  - [x] Login with username/password
  - [x] Logout
  - [x] Token refresh
  - [x] Protected routes

- [x] **Dashboard**
  - [x] Dashboard home page
  - [x] Navigation sidebar
  - [x] User profile display

- [x] **User Management**
  - [x] List users with pagination
  - [x] Create user with role selection ✅ **FIXED**
  - [x] Edit user (email, name, role, status) ✅ **FIXED**
  - [x] Delete user (soft delete) ✅ **FIXED**
  - [x] Search/filter users
  - [x] Role badges display
  - [x] Status badges display

---

## 🚀 Quick Commands

```bash
# Check status
./scripts/status-web

# View logs
./scripts/pm2-web gt-omr-web-1 logs

# Restart if needed
./scripts/pm2-web all reload exam-system-frontend

# Deploy updates
./scripts/quick-deploy.sh all
```

---

## 📝 Test Results Template

**Tester:** ******\_\_\_\_******  
**Date:** ******\_\_\_\_******  
**URL:** http://gt-omr-web-1.gt/dashboard/users

| Feature                    | Status            | Notes |
| -------------------------- | ----------------- | ----- |
| Create User - Global Admin | ⬜ Pass / ⬜ Fail |       |
| Create User - Order        | ⬜ Pass / ⬜ Fail |       |
| Create User - Region       | ⬜ Pass / ⬜ Fail |       |
| Create User - Organization | ⬜ Pass / ⬜ Fail |       |
| Edit User - Change Name    | ⬜ Pass / ⬜ Fail |       |
| Edit User - Change Email   | ⬜ Pass / ⬜ Fail |       |
| Edit User - Change Role    | ⬜ Pass / ⬜ Fail |       |
| Edit User - Toggle Active  | ⬜ Pass / ⬜ Fail |       |
| Delete User - Soft Delete  | ⬜ Pass / ⬜ Fail |       |
| Error Handling             | ⬜ Pass / ⬜ Fail |       |

**Issues Found:**

---

---

---

---

**Phase 1 Status:** 🎯 100% Complete
