# UI / Keyboard shortcut updates

## Current behavior for selecting multiple rows
1. Case when selecting row 2 to row 10 and current row is 2.
- click "select mode checkbox"
- click row 2 (regardless of already at row 2)
- hold shift and click row 10

2. Case when selecting row 2, 5, 7 and current row is 2
- click "select mode checkbox"
- click row 2 (regardless of already at row 2)
- hold ctrl and click row 5
- hold ctrl and click row 7

Change to:
- remove select mode checkbox and let system activate select mode with following condition instead:
1. Case when selecting row 2 to row 10 and current row is 2.
- hold shift and click row 10
system will activate select mode and select row 2 to row 10

2. Case when selecting row 2, 5, 7 and current row is 2
- hold ctrl and click row 5
- hold ctrl and click row 7
system will activate select mode and select row 2, 5, 7

Any navigation or click on other row will deactivate select mode.
