# User Stats API Documentation

This document describes the API endpoint for retrieving user-level statistics for the admin dashboard.

## Endpoint

**GET** `/api/users/stats`

### Description
Retrieves an array of all users with their aggregated processing statistics. This endpoint aggregates data from the `processing_tasks` table based on the user's assigned scopes (Evaluation Center, SNRs, Class Levels).

### Authentication
- Requires **Admin** privileges.
- Header: `Authorization: Bearer <token>`

### Query Parameters (Filters)

| Parameter | Type | Description |
|---|---|---|
| `eval_center_id` | Integer | Filter users/stats by Evaluation Center ID. |
| `class_level` | Integer | Filter aggregated stats by Class Level. |
| `ss_snr_id` | Integer | Filter aggregated stats by SNR ID. |

### Response Schema

Returns a JSON object containing a `stats` list.

```json
{
  "stats": [
    {
      "user_id": 123,
      "username": "gongtham01",
      "full_name": "Gongtham User 01",
      "eval_center_ids": [1],
      "class_levels": [1, 2, 3],
      "snr_count": 28,
      "registered_amount": 45000,
      "present_amount": 42000,
      "error_count": 12,
      "err_duplicate_sheets_count": 2,
      "err_low_answer_count": 5,
      "err_student_id_count": 3,
      "err_absent_count": 2,
      "err_trash_count": 0
    },
    ...
  ]
}
```

### Fields Description

| Field | Type | Description | Label in Thai | Show in Table? |
|---|---|---|---|---|
| `user_id` | Integer | Unique ID of the user. | ID | No |
| `username` | String | User's login username. | username | Yes |
| `full_name` | String | User's full name (optional). | ชื่อผู้ตรวจ | Yes |
| `eval_center_ids` | List[Integer] | List of assigned Evaluation Center IDs. | กองตรวจ | No |
| `class_levels` | List[Integer] | List of assigned Class Levels (from scope). | ชั้น | No |
| `snr_count` | Integer | Number of unique Evaluation Sites (SNRs) accessible to this user. | สนร. | Yes |
| `registered_amount` | Integer | Sum of `registered_amount` for all tasks in user's scope. | สมัครสอบ | Yes |
| `present_amount` | Integer | Sum of `present_amount` (actual forms) for all tasks in user's scope. | คงสอบ | Yes |
| `error_count` | Integer | Total count of errors across all tasks. | ปัญหา | Yes |
| `err_duplicate_sheets_count` | Integer | Count of duplicate sheet errors. | ซ้ำ | Yes |
| `err_low_answer_count` | Integer | Count of low answer errors. | < 140 ข้อ | Yes |
| `err_student_id_count` | Integer | Count of student ID errors. | เลขที่สอบ | Yes |
| `err_absent_count` | Integer | Count of absent errors. | ขาดสอบมีใบตอบ | Yes |
| `err_trash_count` | Integer | Number of sheets/tasks marked as trash. | ถูกลบ | Yes |

eval_center_ids, class_levels are not displayed in the table. They are top filters for the table.
eval_center list can be fetched similar to how it is done on user scope edit page.
class_level value/label: 1 = ชั้นตรี, 2 = ชั้นโท, 3 = ชั้นเอก
ss_snr_id is long list, skipped for now.

### Usage for Admin Dashboard

The Frontend should fetch this data to populate the Admin's "User Level Progress" page. 
The table can be displayed with sortable columns and filters on `username`.
