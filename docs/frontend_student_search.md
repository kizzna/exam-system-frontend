# Student Search API Documentation

This API endpoint allows the frontend to search for students globally across the OMR database. It supports advanced filtering logic for `task_id` ranges and student names.

## Endpoint

`GET /students/search`

## Request Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `q` | `string` | **Yes** | - | The search query string. Supports numeric task IDs and/or student names. |
| `limit` | `integer` | No | `50` | Maximum number of records to return (1-100). |
| `offset` | `integer` | No | `0` | Number of records to skip (for pagination). |

## Search Logic

The backend automatically detects the type of search based on the input string `q`:

1.  **Task ID Search (Numeric)**:
    *   **6 digits** (e.g., `101001`): Searches range `10100111` to `10100133`.
    *   **7 digits** (e.g., `1010012`): Searches range `10100121` to `10100123`.
    Note: 7th digit must be 1-3. If not, simply notify user that the input is invalid.
    It saves roundtrip of getting empty results.
    *   **8 digits** (e.g., `10100111`): Searches for exact match.
    Note: 8th digit must be 1-3. If not, simply notify user that the input is invalid.
    It saves roundtrip of getting empty results.

2.  **Name Search (Text)**:
    *   **Single Word** (e.g., `Somchai`): Searches `firstname` OR `lastname` starting with the term.
    *   **Two Words** (e.g., `Somchai Jaidee`): Searches `firstname` AND `lastname`.
    Note: If the input is not a Thai or English alphabet, simply notify user that the input is invalid.
    It saves roundtrip of getting empty results.

3.  **Combination (Numeric + Text)**:
    *   Input like `101001 Somchai` will combine the Task ID range logic with the Name search logic.
    Note: If the input is not a Thai or English alphabet, simply notify user that the input is invalid.
    It saves roundtrip of getting empty results.

## Response Format

```json
{
  "data": [
    {
      "snr_name": "วัดบวรนิเวศวิหาร",
      "task_id": "10100111",
      "exam_center_code": "101001",
      "class_level": "4",
      "class_group": "1",
      "master_roll": "1",
      "student_roll": "10001",
      "prefix_name": "เด็กชาย",
      "firstname": "กิตติธัช",
      "lastname": "ศิลา",
      "present_status": "มาสอบ"
    }
  ],
  "meta": {
    "total": 233,
    "limit": 50,
    "offset": 0
  }
}
```

## Example Usage

### 1. Search by Exam Center (Task ID prefix)
Query for all students in exam center 101001 (Task ID prefix for Pali Exams):
`GET /students/search?q=101001`

### 2. Search by Name
Query for student named "Somchai":
`GET /students/search?q=Somchai`

### 3. Search by Name within Exam Center
Query for "Somchai" within center 101001:
`GET /students/search?q=101001 Somchai`


# New api result that required to transform:

```json
{
    "data": [
        {
            "snr_name": "วัดบวรนิเวศวิหาร",
            "task_id": "10100911",
            "exam_center_code": "101009",
            "class_level": "4",
            "class_group": "1",
            "master_roll": "13",
            "student_roll": "10013",
            "prefix_name": "เด็กหญิง",
            "firstname": "หยกทิพย์",
            "lastname": "ด้วงแพง",
            "present_status": "มาสอบ"
        },
        / * ... */
    ],
    "meta": {
        "total": 4,
        "limit": 50,
        "offset": 0
    }
}
```
class_level and label
1 - นธ.ตรี
2 - นธ.โท
3 - นธ.เอก
4 - ธศ.ตรี
5 - ธศ.โท
6 - ธศ.เอก

class_group and label
1 - ประถม
2 - มัธยม
3 - อุดม

