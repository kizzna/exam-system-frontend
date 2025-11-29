# Frontend Implementation Guide: Enhanced Task List & Batch Statistics

## Overview
This document outlines the changes required in the frontend to support the enhanced task list filters and the new batch statistics feature.

## 1. Task List Enhancements

### New Columns
The task list table should now include the following columns:
- `latest_batch_id` (label: Batch ID, optional, do not display if too many columns)
- `error_count` (label: ERRORS, use badge 🔴)
- `err_duplicate_sheets_count` (label: DUP., use badge 🟠)
- `err_low_answer_count` (label: LOW ANS., use badge 🟡)
- `err_student_id_count` (label: ID., use badge 🔴)
- `err_exam_center_id_count` (label: Center Code, optional, use badge 🟣, do not display if too many columns)
- `err_class_group_count` (label: GRP, optional, use badge 🟤, do not display if too many columns)
- `err_class_level_count` (label: LVL, optional, use badge 🟦, do not display if too many columns)

### New Filters
Implement the following filters in the task list view:

| Filter Name | API Parameter | Type | Description |
| :--- | :--- | :--- | :--- |
| Class Group | `class_group` | Integer | Exact match |
| Latest Batch ID | `latest_batch_id` | Integer | Exact match |
| Task ID | `task_id` | String | Starts with (e.g., "102" matches "102...") |
| Error Count | `error_count` | Integer | Greater than input |
| Duplicate Sheets Error | `err_duplicate_sheets_count` | Integer | Greater than input |
| Low Answer Error | `err_low_answer_count` | Integer | Greater than input |
| Student ID Error | `err_student_id_count` | Integer | Greater than input |
| Exam Center ID Error | `err_exam_center_id_count` | Integer | Greater than input |
| Class Group Error | `err_class_group_count` | Integer | Greater than input |
| Class Level Error | `err_class_level_count` | Integer | Greater than input |



### Batch Statistics

### Batch Info Page
Enhance the batch upload result page (or batch details page) to display aggregated statistics for the batch.

### API Endpoint
`GET /api/batches/{batch_id}/stats`

**Response:**
```json
{
  "registered_total": 1272,
  "sheets_total": 1160,
  "error_total": 133,
  "err_duplicate_sheets_total": 62,
  "err_low_answer_total": 12,
  "err_student_id_total": 23,
  "err_center_code_total": 48,
  "err_class_group_total": 34,
  "err_class_level_total": 12
}
```

**Implementation:**
- Call this endpoint using the `batch_uuid` available after upload or in the batch list.
- Display the returned statistics in a summary view.
