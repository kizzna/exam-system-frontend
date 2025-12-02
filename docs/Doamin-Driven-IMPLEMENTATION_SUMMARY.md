# Domain-Driven Architecture - Quick Implementation Summary

## What Has Been Created

### 1. Comprehensive Refactoring Guide
**File:** `EXAM_SYSTEM_REFACTORING_GUIDE.md`

This 800+ line guide contains:
- Complete architectural vision
- 7-phase implementation plan
- Domain design patterns (Repository, Service, DI)
- Endpoint specifications for all 9 domains
- Code examples and best practices
- Migration strategy with zero downtime
- Performance optimization guidelines
- Organizational hierarchy implementation

### 2. Base Domain Infrastructure
**Location:** `src/domains/_base/`

Created foundational abstractions:
- `repository.py` - Generic repository pattern with CRUD operations
- `service.py` - Base service class for business logic
- `exceptions.py` - Domain-specific exception hierarchy
  - `DomainException` (base)
  - `EntityNotFoundError`
  - `ValidationError`
  - `PermissionDeniedError`
  - `BusinessRuleViolationError`

### 3. Complete Batches Domain Example
**Location:** `src/domains/batches/`

Fully implemented domain showing the pattern:

- **`schemas.py`** - API request/response models (Pydantic)
  - `BatchCreateRequest` - Upload request validation
  - `BatchResponse` - Batch details response
  - `BatchListResponse` - Paginated list response
  - `BatchSearchFilters` - Advanced filtering
  - `UploadType` & `BatchStatus` enums

- **`models.py`** - Domain entity (Batch dataclass)
  - Business logic methods (`is_deletable()`, `can_be_processed()`)
  - DB row mapping

- **`repository.py`** - Data access layer
  - All CRUD operations implemented
  - Advanced filtering and pagination
  - User-scoped queries
  - Count operations

- **`service.py`** - Business logic layer
  - `create_batch()` - Upload workflow
  - `get_batch()` - Retrieval with permissions
  - `list_user_batches()` - Filtered listing
  - `update_batch_status()` - Status management
  - `delete_batch()` - Protected deletion

- **`dependencies.py`** - Dependency injection
  - FastAPI-compatible DI setup
  - Repository and service factories

- **`__init__.py`** - Clean module exports

## How to Use This Architecture

### Pattern for Creating New Domains

Each domain follows this structure:

```
src/domains/<domain_name>/
├── __init__.py           # Module exports
├── schemas.py            # API request/response (Pydantic)
├── models.py             # Domain entities (dataclasses)
├── repository.py         # Database access (extends BaseRepository)
├── service.py            # Business logic (extends BaseService)
└── dependencies.py       # DI setup for FastAPI
```

### Example: Creating Tasks Domain

1. **Create folder:** `src/domains/tasks/`

2. **Define schemas** (`schemas.py`):
```python
from pydantic import BaseModel
from src.domains.batches.schemas import BatchStatus  # Reuse enums

class TaskCreateRequest(BaseModel):
    name: str
    batch_id: str

class TaskResponse(BaseModel):
    task_id: str
    name: str
    status: str
    assigned_to: Optional[str]
```

3. **Create domain model** (`models.py`):
```python
@dataclass
class Task:
    task_id: str
    name: str
    status: str
    
    @classmethod
    def from_db_row(cls, row: dict) -> 'Task':
        return cls(...)
```

4. **Implement repository** (`repository.py`):
```python
from src.domains._base import BaseRepository

class TaskRepository(BaseRepository[Task]):
    def find_by_id(self, id: str) -> Optional[Task]:
        # SQL query implementation
        pass
```

5. **Create service** (`service.py`):
```python
from src.domains._base import BaseService

class TaskService(BaseService):
    def __init__(self, repository: TaskRepository):
        self.repository = repository
    
    def create_task(self, request: TaskCreateRequest) -> TaskResponse:
        # Business logic
        pass
```

6. **Setup dependencies** (`dependencies.py`):
```python
from fastapi import Depends

def get_task_service(
    repository: TaskRepository = Depends(get_task_repository)
) -> TaskService:
    return TaskService(repository)
```

7. **Create router** (`src/api/routers/tasks.py`):
```python
from fastapi import APIRouter, Depends
from src.domains.tasks import TaskService, get_task_service

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.post("/", response_model=TaskResponse)
async def create_task(
    request: TaskCreateRequest,
    service: TaskService = Depends(get_task_service)
):
    return service.create_task(request)
```

8. **Register in main.py**:
```python
from src.api.routers import tasks
app.include_router(tasks.router)
```

## Next Steps

### Phase 1: Foundation (Weeks 1-2)
**Status:** ✅ Infrastructure created, ready for auth implementation

**Remaining Tasks:**
1. Create `src/domains/auth/` - JWT authentication
2. Create `src/domains/users/` - Basic user CRUD
3. Create `src/api/middleware/auth.py` - Authentication middleware
4. Test login/logout flow

**Files to Create:**
```
src/domains/auth/
├── schemas.py         # LoginRequest, TokenResponse
├── service.py         # AuthService (login, verify, refresh)
├── security.py        # JWT, password hashing
└── dependencies.py    # get_current_user

src/domains/users/
├── schemas.py         # UserCreate, UserResponse
├── models.py          # User entity
├── repository.py      # UserRepository
├── service.py         # UserService
└── dependencies.py

src/api/middleware/
├── auth.py            # JWT validation middleware
└── permissions.py     # Permission checking
```

### Phase 2: Batches Router (Week 3)
**Status:** ✅ Domain complete, needs router

**Remaining Tasks:**
1. Create `src/api/routers/batches.py`
2. Extract file upload logic from `jobs.py`
3. Test upload workflows
4. Mark old endpoints as deprecated

**Router Example:**
```python
# src/api/routers/batches.py
from fastapi import APIRouter, UploadFile, File
from src.domains.batches import get_batch_service

router = APIRouter(prefix="/api/batches", tags=["Batches"])

@router.post("/", response_model=BatchResponse)
async def create_batch(
    file: UploadFile = File(...),
    service = Depends(get_batch_service)
):
    # Implementation
    pass
```

### Phase 3-7: Remaining Domains

Follow the same pattern for:
- **Tasks** (Week 5-7)
- **Sheets** (Week 8-12) - Most complex
- **Grading** (Week 13)
- **Exports** (Week 14)
- **Students** (Week 15)
- **Audit** (Week 16)

## Key Benefits of This Architecture

### 1. **Separation of Concerns**
- **Routers**: Only handle HTTP (thin layer)
- **Services**: Business logic and orchestration
- **Repositories**: Database access only
- **Schemas**: API contracts (Pydantic validation)
- **Models**: Domain entities (business objects)

### 2. **Testability**
```python
# Unit test (no database)
def test_batch_deletion_rules():
    batch = Batch(status='processing', ...)
    assert not batch.is_deletable()

# Integration test (with mocks)
def test_create_batch_service():
    mock_repo = MockBatchRepository()
    service = BatchService(mock_repo)
    result = service.create_batch(...)
    assert result.batch_id is not None
```

### 3. **Extensibility**
- Add new domain: Create folder, follow pattern
- Add new endpoint: Add method to service, expose in router
- Add new business rule: Modify service, rules isolated

### 4. **Maintainability**
- Clear boundaries: Each file has single responsibility
- Easy navigation: Predictable structure
- Self-documenting: Type hints and docstrings

### 5. **Scalability**
- Services are stateless
- Repositories handle DB pooling
- Async support throughout
- Horizontal scaling ready

## Database Schema Requirements

### For Auth Domain (✅ Created)
```sql
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

CREATE TABLE user_sessions (
    session_id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at)
);
```

### For Batches Domain (Duplicate columns, need review)
```sql
-- Enhance existing omr_batches table
ALTER TABLE omr_batches
ADD COLUMN upload_type VARCHAR(20) DEFAULT 'zip_no_qr', -- Exists: enum('zip_qr','zip_no_qr','images')
ADD COLUMN created_by INT NULL, -- Exists with name: uploaded_by
ADD COLUMN description TEXT NULL, -- Added
ADD COLUMN total_files INT NULL, -- Added
ADD COLUMN total_sheets INT NULL, -- Exits with name: sheet_count
ADD COLUMN storage_path VARCHAR(500) NULL, -- Added
ADD INDEX idx_created_by (created_by),
ADD INDEX idx_status (status),
ADD INDEX idx_created_at (created_at);
```

## Migration Strategy

### Gradual Migration (Zero Downtime)

**Step 1: Add New Endpoints (Keep Old)**
```python
# New endpoint
@router.post("/api/batches/", ...)  # New domain architecture

# Old endpoint (keep working)
@router.post("/api/jobs/submit", deprecated=True, ...)  # Old monolithic
```

**Step 2: Update Clients Gradually**
- Frontend updates to use `/api/batches/`
- Monitor usage of old endpoints
- Keep old endpoints for 2-4 weeks

**Step 3: Deprecation Warnings**
```python
@router.post("/api/jobs/submit", deprecated=True)
async def submit_unified(...):
    """DEPRECATED: Use POST /api/batches/ instead"""
    # Add deprecation warning to response headers
    # Proxy to new service or keep old logic
```

**Step 4: Remove Old Code**
- After clients migrated
- After grace period
- Remove old router methods
- Clean up unused code

## Common Patterns

### 1. Permission Checking
```python
# In service
from src.domains._base import PermissionDeniedError

def delete_batch(self, batch_id: str, user_id: str):
    batch = self.repository.find_by_id(batch_id)
    
    if batch.created_by != user_id and not user.is_admin:
        raise PermissionDeniedError("Can only delete own batches")
```

### 2. Validation
```python
# In schemas (Pydantic validators)
class BatchCreateRequest(BaseModel):
    upload_type: UploadType
    
    @validator('upload_type')
    def validate_upload_type(cls, v):
        if v not in [UploadType.ZIP_WITH_QR, ...]:
            raise ValueError("Invalid upload type")
        return v
```

### 3. Error Handling
```python
# In router
from src.domains._base import EntityNotFoundError, DomainException

@router.get("/{batch_id}")
async def get_batch(batch_id: str, service = Depends(...)):
    try:
        return service.get_batch(batch_id)
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    except DomainException as e:
        raise HTTPException(status_code=400, detail=e.message)
```

### 4. Pagination
```python
# In service
def list_batches(self, filters: SearchFilters) -> ListResponse:
    offset = (filters.page - 1) * filters.page_size
    items = self.repository.find_all(
        filters=...,
        limit=filters.page_size,
        offset=offset
    )
    total = self.repository.count(filters=...)
    
    return ListResponse(items=items, total=total, page=filters.page)
```

## Testing Strategy

### Unit Tests
```python
# tests/domains/batches/test_models.py
def test_batch_is_deletable():
    batch = Batch(status='failed', ...)
    assert batch.is_deletable()
    
    batch.status = 'processing'
    assert not batch.is_deletable()
```

### Service Tests (with mocks)
```python
# tests/domains/batches/test_service.py
class MockBatchRepository(BatchRepository):
    def __init__(self):
        self.batches = {}
    
    def create(self, batch):
        self.batches[batch.batch_id] = batch
        return batch

def test_create_batch():
    repo = MockBatchRepository()
    service = BatchService(repo)
    
    request = BatchCreateRequest(upload_type='zip_qr')
    result = service.create_batch(request, 'user1', 1000, '/path')
    
    assert result.batch_id in repo.batches
```

### API Tests
```python
# tests/api/test_batches.py
from fastapi.testclient import TestClient

def test_create_batch_endpoint():
    client = TestClient(app)
    response = client.post("/api/batches/", json={...})
    
    assert response.status_code == 201
    assert 'batch_id' in response.json()
```

## Conclusion

You now have:
1. ✅ **Complete architectural blueprint** (EXAM_SYSTEM_REFACTORING_GUIDE.md)
2. ✅ **Base infrastructure** for all domains
3. ✅ **Working example** (Batches domain)
4. ✅ **Clear patterns** to follow for remaining domains
5. ✅ **Migration strategy** for zero downtime
6. ✅ **Testing approach** for quality assurance

**Recommended Next Action:**
Start Phase 1 by implementing the Auth domain following the exact pattern shown in the Batches domain example.
