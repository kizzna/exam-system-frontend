# Frontend Roster Status Update

## Overview
The backend `get_roster` API has been updated to include refined status types and a specific sort order. Please update the frontend to handle these new statuses and ensure the UI reflects the priority.

## New `row_status` Values
| Status | Description | Priority (Sort Order) |
| :--- | :--- | :--- |
| `GHOST` | Sheet found but no matching student in master list. (Bit 2 / Flag 4) | 1 |
| `DUPLICATE` | **[NEW]** Sheet marked as duplicate. (Bit 0 / Flag 1) | 2 |
| `ABSENT_MISMATCH` | **[NEW]** Student marked absent in master list but submitted a sheet. (Bit 6 / Flag 64) | 3 |
| `ERROR` | Other errors (Low Answer, Manual Review, etc.) | 4 |
| `MISSING` | Student active in master list but no sheet found. | 5 |
| `OK` | Normal sheet, no errors. | 6 |
| `ABSENT` | Student absent in master list and no sheet found. (Normal absent) | 7 |

## Sort Order
The API now returns rows sorted by:
1. `row_status` (according to the priority above)
2. `original_filename` (Ascending)

## Action Items
- Update TypeScript enums/types to include `DUPLICATE` and `ABSENT_MISMATCH`.
- Update status chips/badges in the UI to handle these new statuses (e.g., specific colors/labels).
- `ABSENT_MISMATCH` should likely be highlighted as an error (Red/Orange), whereas `ABSENT` is usually neutral (Grey).
