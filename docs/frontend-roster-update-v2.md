# Frontend Update Guide: Roster API v2

## Overview
The `GET /tasks/{id}/roster` API has been updated to improve how potential errors and sheet statuses are calculated. The backend now performs "Effective Flag" calculation, which means the frontend no longer needs to implement complex logic to determine if an error should be hidden based on manual corrections.

## Changes in Response Object (`RosterRow`)

### 1. New Field: `effective_flags`
*   **Type**: `int` (Bitmask)
*   **Description**: This represents the `error_flags` *after* applying any manual corrections (`corrected_flags`).
*   **Usage**: Use this field to determine which error icons/badges to display. Do NOT use `error_flags` for display unless you specifically want to show "ignored" errors.
*   **Logic**:
    *   If `effective_flags` is 0, the sheet is considered "Clean" (OK).
    *   If `effective_flags` > 0, the sheet has active errors.

### 2. Updated Status Logic (`row_status`)
The logic for `row_status` has been simplified and formalized:

| Status    | Description                                      | Condition                                      |
| :-------- | :----------------------------------------------- | :--------------------------------------------- |
| `MISSING` | Student is in Master List but has no sheet.      | `sheet_id` is NULL AND `is_absent_in_master` = 0|
| `ABSENT`  | Student is absent in Master List and has no sheet (Good State). | `sheet_id` is NULL AND `is_absent_in_master` = 1|
| `ERROR`   | Sheet exists but has uncorrected errors.     | `sheet_id` is NOT NULL AND `effective_flags` > 0|
| `OK`      | Sheet exists and is clean (or all errors corrected). | `sheet_id` is NOT NULL AND `effective_flags` = 0|
| `GHOST`   | Sheet exists but Student ID not in master.       | `source` = 'ghost'                             |

### 3. Simplified detailed error message (`error_message`)
The `error_message` field is now populated based on `effective_flags`. You can display this string directly in the UI for the "Error" column or tooltip.

## Frontend Implementation Checklist

1.  [ ] **Update Type Definition**: Add `effective_flags: number` to your TypeScript interface for the roster row.
2.  [ ] **Simplify Status Logic**:
    *   Remove custom frontend logic that checks `corrected_flags` to override `row_status`.
    *   Trust the `row_status` returned from the API.
3.  [ ] **Update Error Display**:
    *   Drive error icons/tooltips using `effective_flags` instead of derived logic.
    *   Example: If you previously checked `(row.error_flags & 2 && !(row.corrected_flags & 32))`, replace it with `(row.effective_flags & 2)`.

## Example Response

```json
[
  {
    "source": "master",
    "master_roll": "1001",
    "student_name": "John Doe",
    "is_absent_in_master": 0,
    "sheet_id": 123,
    "sheet_roll": 1001,
    "error_flags": 34,        // e.g., 32 (Level Mismatch) | 2 (Low Answer)
    "corrected_flags": 32,    // 32 (Ignore Low Answer)
    "effective_flags": 34,    // WAIT, calculation depends on mask. 
                              // If corrected_flags has 32 (Ignore Low Answer), 
                              // we mask out bit 2.
                              // So effective_flags = 32 (Level Mismatch).
    "row_status": "ERROR",
    "error_message": "Level Mismatch"
  }
]
```

## Note on "UNEXPECTED"
The `UNEXPECTED` status (Marked Absent but sheet exists) is now folded into `ERROR`.
*   It generates a specific error message: "Marked Absent in DB but Sheet Exists".
*   It sets a specific bit in `error_flags` (likely implicit or dependent on implementation, but checked via `effective_flags`).

## Reference: error_flags and corrected_flags
**error_flags and error_flags_raw bit-mask values and meaning**
** Note: error_flags_raw is used for audit and error_flags is used for processing **
- 1  # Bit 0: Duplicate sheet (center code + class + group + student roll, 11 digits duplicate Nationwide)
- 2  # Bit 1: Too few answers (< 140 out of 150 answers detected)
- 4  # Bit 2: Student ID error
- 8  # Bit 3: Exam center ID error
- 16 # Bit 4: Class group error
- 32 # Bit 5: Class level error
- 64 # Bit 6: Absent status but sheet is present and match registered name
- 128 # Bit 7: Review required
**corrected_flags bit-mask values and meaning**
- 1  # Bit 0: auto corrected class group (auto: "Mark all omr sheets as `task_id` 8th digit" )
- 2  # Bit 1: auto corrected class level (auto: "Mark all omr sheets as `task_id` 7th digit" )
- 4  # Bit 2: auto corrected exam center (auto: "Mark all omr sheets as `task_id` first 6 digits" )
- 8  # Bit 3: auto corrected student roll
- 16 # Bit 4: marked as present (means student has absent status but sheet is present and match registered name)
- 32 # Bit 5: confirm that omr has < 141 marked answers
- 64 # Bit 6: Passed by policy due to documented administrative error 
- 128 # Bit 7: manually corrected (Nullifies error_flags bits: 1, 6, 7)