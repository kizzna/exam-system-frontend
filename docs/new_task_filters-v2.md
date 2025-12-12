# Frontend API Documentation: Task List Filters

New filters have been added to the Task List API to support filtering by sheet counts and missing sheets.

## New Query Parameters

The following parameters can be added to the `GET /tasks/` and `GET /tasks/stats` requests.

| Parameter | Type | Description | Logic |
| :--- | :--- | :--- | :--- |
| `registered_amount` | `integer` | Filter tasks by registered student count | `>= input` |
| `present_amount` | `integer` | Filter tasks by present student count | `>= input` |
| `actual_sheet_count` | `integer` | Filter tasks by physical sheet count | `>= input` |
| `missing_sheet_count` | `integer` | Filter tasks by missing physical sheets (Present - Scanned) | [(present - actual) >= input](file:///workspaces/omr-backend/src/domains/tasks/repository.py#299-301) |
| `excessive_sheet_count` | `integer` | Filter tasks by excessive physical sheets (Scanned - Present) | [(actual - present) >= input](file:///workspaces/omr-backend/src/domains/tasks/repository.py#299-301) |
| `trash_count` | `integer` | Filter tasks by number of sheets in trash | `>= input` |
| `empty_task` | `boolean` | Filter tasks with 0 scanned sheets | `actual_sheet_count = 0` if true |

## Example Usage

### Missing Physical Sheets
To find tasks where students are marked present but their sheets were not scanned:
```http
GET /tasks/?page=1&size=50&missing_sheet_count=1
```

### Excessive Physical Sheets
To find tasks where more sheets were scanned than students marked present:
```http
GET /tasks/?excessive_sheet_count=1
```

### Trash Count
To find tasks with deleted sheets:
```http
GET /tasks/?trash_count=1
```

### High Error & Missing Sheets
To find tasks with errors AND missing sheets:
```http
GET /tasks/?error_count=1&missing_sheet_count=1
```

### Empty Tasks (No Scanned Sheets)
To find tasks that have not been scanned yet (e.g., waiting for upload):
```http
GET /tasks/?empty_task=true
```

### Registered Count
To find large classes (e.g., > 100 students):
```http
GET /tasks/?registered_amount=100
```
