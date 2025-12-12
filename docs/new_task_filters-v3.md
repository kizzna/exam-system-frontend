# Frontend API Documentation: Task List Filters

New filters have been added to the Task List API to support filtering by sheet counts and missing sheets.

## New Query Parameters

The following parameters can be added to the `GET /tasks/` and `GET /tasks/stats` requests.

| Parameter | Type | Description | Logic |
| :--- | :--- | :--- | :--- |
| `trash_count` | `integer` | Filter tasks by number of sheets in trash | `>= input` |

## Example Usage

### Trash Count
To find tasks with deleted sheets:
```http
GET /tasks/?trash_count=1
```

## Position for filters:
- trash_count should be placed inside advanced filters (ตัวกรองอื่นๆ)
and label it as "ใบตอบที่ถูกลบ"

## Postion for column data:
- deleted_sheets_total should be after column "ขาดสอบมีใบตอบ"
and label it as "ถูกลบ"