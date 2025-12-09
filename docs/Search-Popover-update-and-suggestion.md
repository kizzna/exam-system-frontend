# Search Popover update and suggestion

## Overview
Currently, when user press master roll, student roll (5 digits), or press enter when a row is selected, it will open the search popover. It also shows GHOST status rows which does not have any name beucase they couldn't mapped with master data
hence the name ghost. It should not show GHOST status rows on search popover.
Another feature is to suggest row based on reference roll of previous row and next row.
If roll number of next row - roll number of previous row is 1, it will suggest missing number between them.
For example, current row has error status, previous row has roll 10003, next row has roll 10005, it will suggest roll 10004.
Suggested roll must exist in the roster.

### Scenario
1. User navigate to first error row
2. User press enter (or click on roll/master roll) to open search popover
3. System detects that user is on 4th row, 3rd row has roll number of 10008, 5th row has roll number of 10010
4. System will find student with roll number of 10009, if exists, it will be first item on the list.
5. User checks that suggested roll is correct, user press arrow down to select and press enter to assign this student to selected sheet.

### Note: This works on any mode (Sequential or Priority).
