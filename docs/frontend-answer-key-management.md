# Answer Key Management API Implementation Guide

This document outlines the API endpoints available for managing OMR answer keys. These endpoints allow listing, viewing details, deleting, and activating answer keys.

> [!IMPORTANT]
> **Admin Permissions Required**:
> The `DELETE` and `ACTIVATE` endpoints require the user to have admin privileges (`users.is_admin = 1`).
> You must pass the User ID in the `X-User-Id` header for these requests.

## Endpoints

### 1. List Answer Keys
Retrieve a paginated list of answer keys with optional filtering.

- **Method**: `GET`
- **URL**: `/api/answer-keys/`
- **Query Parameters**:
  - `exam_session_id` (int, optional): Filter by exam session.
  - `class_group` (int, optional): Filter by class group (1-3).
  - `class_level` (int, optional): Filter by class level (1-3).
  - `status` (string, optional): Filter by processing status (e.g., 'processed', 'pending').
  - `limit` (int, default=100): Number of items to return.
  - `offset` (int, default=0): Pagination offset.

**Example Request:**
```http
GET /api/answer-keys/?exam_session_id=4&class_level=1 HTTP/1.1
Host: api.example.com
```

**Example Response:**
```json
[
  {
    "id": 481,
    "sheet_uuid": "ac1cb9f4-8412-4899-903e-73034f7965f1",
    "batch_id": 123,
    "exam_session_id": 4,
    "class_group": 1,
    "class_level": 1,
    "processing_status": "processed",
    "is_active": 1,
    "original_filename": "answer-key-class1-group1.jpg",
    "created_at": "2025-12-02T12:35:22",
    "updated_at": "2025-12-02T12:35:22"
  }
]
```

### 2. Get Answer Key Details
Retrieve detailed information about a specific answer key.

- **Method**: `GET`
- **URL**: `/api/answer-keys/{id}`

**Example Request:**
```http
GET /api/answer-keys/481 HTTP/1.1
Host: api.example.com
```

### 3. Activate Answer Key
Set an answer key as "active" for its specific exam session, class group, and level. This will automatically deactivate any other answer keys matching these criteria.

- **Method**: `POST`
- **URL**: `/api/answer-keys/{id}/activate`
- **Headers**:
  - `X-User-Id`: (Required) ID of the admin user performing the action.

**Example Request:**
```http
POST /api/answer-keys/481/activate HTTP/1.1
Host: api.example.com
X-User-Id: 101
```

**Example Response:**
```json
{
  "message": "Answer key activated successfully",
  "id": 481
}
```

### 4. Delete Answer Key
Delete an answer key and its associated answers.

- **Method**: `DELETE`
- **URL**: `/api/answer-keys/{id}`
- **Headers**:
  - `X-User-Id`: (Required) ID of the admin user performing the action.

**Example Request:**
```http
DELETE /api/answer-keys/481 HTTP/1.1
Host: api.example.com
X-User-Id: 101
```

**Example Response:**
```json
{
  "message": "Answer key deleted successfully",
  "id": 481
}
```

## Implementation Notes

- **Admin Check**: The backend verifies `users.is_admin = 1` for the user ID provided in the `X-User-Id` header. Ensure the frontend sends the ID of the currently logged-in user.
- **Activation Logic**: Activating a key is an exclusive operation for a given (Exam Session, Class Group, Class Level) tuple. The backend handles deactivating others automatically.
