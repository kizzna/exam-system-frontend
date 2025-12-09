# Roster Jumper Mode Update

## Jumper modes
Jumper mode is to let user navigate through set of statuses of omr sheets.
Example flow:
1. User is in DEFAULT mode and at row 100.
2. User clicks on Jumper mode and selects DUPLICATE.
3. User is now in DUPLICATE mode and at row 100.
4. User press "Down" arrow key.
5. System navigates to next row with status DUPLICATE.
6. User press "Down" arrow key.
7. System navigates to next row with status DUPLICATE.
Note: if it is last row of this status, system should navigate to first row of this status.
If user press "Up" arrow key, system should navigate to previous row with status DUPLICATE.
If it is first row of this status, system should navigate to last row of this status.

### `row_status` Values
| Status | Description | Priority (Sort Order) |
| :--- | :--- | :--- |
| `GHOST` | Sheet found but no matching student in master list. (Bit 2 / Flag 4) | 1 |
| `DUPLICATE` | Sheet marked as duplicate. (Bit 0 / Flag 1) | 2 |
| `ABSENT_MISMATCH` | Student marked absent in master list but submitted a sheet (aka Unexpected Sheet). (Bit 6 / Flag 64) | 3 |
| `ERROR` | Other errors (Low Answer, Manual Review, etc.) | 4 |
| `MISSING` | Student active in master list but no sheet found. | 5 |
| `OK` | Normal sheet, no errors. | 6 |
| `ABSENT` | Student absent in master list and no sheet found. (Normal absent) | 7 |

### Design
Currently 2 modes are in form of tabs that taking 50% of the panel each.
We can reduce this to take just normal size, left aligned.
Dropdown for jumper modes will be placed after tabs on same row.
Dropdown jumper modes order:
1. DEFAULT (Default sequential mode order)
2. DUPLICATE
3. GHOST
4. ABSENT_MISMATCH
5. ERROR
6. MISSING
7. ABSENT
8. OK

### Note: If this mode works well, we can remove "Priority" mode later as it is not required any more.