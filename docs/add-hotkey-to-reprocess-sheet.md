# add hotkey to reprocess sheet

## 1. reprocess current row with profile_id=1

Request URL
http://omr.gt/api/sheets/reprocess
Request Method
POST
Payload:
{
    "sheet_ids": [
        1012666
    ],
    "profile_id": 1
}
Shortcut: Ctrl-/

Note: When pressed it'll reprocess the current row with profile_id=1, 
similar to the "Reprocess" button in the sheet row -> choose profile_id=1 -> click "Reprocess"

## 2. reprocess current row with profile_id=40

Request URL
http://omr.gt/api/sheets/reprocess
Request Method
POST
Payload:
{
    "sheet_ids": [
        1012666
    ],
    "profile_id": 40
}
Shortcut: Ctrl-Shift-/

Note: When pressed it'll reprocess the current row with profile_id=40, 
similar to the "Reprocess" button in the sheet row -> choose profile_id=40 -> click "Reprocess"