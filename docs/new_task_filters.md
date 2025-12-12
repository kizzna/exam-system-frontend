# Frontend API Documentation: Task List Filters

New filters have been added to the Task List API to support filtering by sheet counts and missing sheets.

## New Query Parameters

The following parameters can be added to the `GET /tasks/` and `GET /tasks/stats` requests.

| Parameter | Type | Description | Logic |
| :--- | :--- | :--- | :--- |
| `registered_amount` | `integer` | Filter tasks by registered student count | `>= input` |
| `present_amount` | `integer` | Filter tasks by present student count | `>= input` |
| `actual_sheet_count` | `integer` | Filter tasks by physical sheet count | `>= input` |
| `missing_sheet_count` | `integer` | Filter tasks by calculated missing count | [(registered - present) >= input] |

## Example Usage

### specific Missing Sheets
To find tasks that have at least 5 missing sheets:
```http
GET /tasks/?page=1&size=50&missing_sheet_count=5
```

### High Error & Missing Sheets
To find tasks with errors AND missing sheets:
```http
GET /tasks/?error_count=1&missing_sheet_count=1
```

### Registered Count
To find large classes (e.g., > 100 students):
```http
GET /tasks/?registered_amount=100
```

## Position for filters:
- missing_sheet_count should be placed after err-absent (ขาดสอบมีใบตอบ)
and label it as "ใบตอบหายอย่างน้อย"
- registered_amount, present_amount and actual_sheet_count should be placed inside Advanced filter (ตัวกรองอื่นๆ).
Label them as "จำนวนสมัครสอบ"
"จำนวนเข้าสอบ"
"จำนวนสแกน"