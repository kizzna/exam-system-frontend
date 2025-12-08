# OMR Editor update


## 1. OMR Editor priority mode update

### Current behavior
- Edit sheet -> corrected -> it moves to first normal sheet and since current row is this current view is moved down
you have to press HOME to go to top to find next sheet with error

### Desired behavior
- Edit sheet -> corrected -> current row become next sheet with error unless there is no sheet with error

## 2. Stats and overlay refresh
- All stats, name overlay and answers are currently not refreshed after correction
2.1 overlay for Panel A is from api: /sheets/{sheet_id}/overlay
2.2 Stats are on Panel B is from api: /tasks/stats?task_id={task_id}
2.3 Answers on Panel D is from same overlay api: /sheets/{sheet_id}/overlay
Note: Answers only required to refresh if answers are changed

# Example of Api response

http://gt-omr-api-1.gt:8000/sheets/944380/overlay
{
    "student_name": {
        "value": "เด็กชายนัฐพงศ์ สุทธิศักดิ์",
        "x": 145,
        "y": 150
    },
    "top": {
        "dimensions": {
            "w": 1440,
            "h": 595
        },
        "values": {
            "class_level": 1,
            "class_group": 2,
            "exam_center": 103001,
            "student_roll": 20006
        },
        "scores": {
            "subject1": 70,
            "subject2": 52,
            "subject3": 76
        }
    },
    "bottom": {
        "dimensions": {
            "w": 1170,
            "h": 1650
        },
        "answers": [
            {
                "q": 1,
                "val": 1
            },
            /* ... */
        ]
    }
}   

http://gt-omr-api-1.gt:8000/tasks/stats?task_id=10300112
response:
{
    "registered_total": 204,
    "present_total": 171,
    "actual_sheets_total": 171,
    "error_total": 13,
    "err_duplicate_sheets_total": 12,
    "err_low_answer_total": 0,
    "err_student_id_total": 0,
    "err_exam_center_id_total": 0,
    "err_class_level_total": 0,
    "err_class_group_total": 0,
    "err_absent_count_total": 1
}

## 3. Keyboard shotcut updates for
### 3.1 SEQUENTIAL mode
- Current behavior: press 'n' to move to next sheet with "error"
- Desired behavior: keep behaviour of 'n' to move to next sheet with "error" 
#### new keyboard shotcuts and logic
- 'n' -> if current row is already at last, move to first sheet with "error" else move to next sheet with "error"
- 'p' -> if current row is already at first, move to last sheet with "error" else move to previous sheet with "error"

## 4. Search Student ID...
- Current behavior: search by student id (master roll)
- Desired behavior: if starts with 0-9 -> search by student roll else search by student name
Add ability to use arrow up and down on Search window, currently arrow up and down moves to next and previous row of main list. If search window is open, arrow up and down should move to next and previous row of search list. Choose by either mouse click or press enter.

### 4.1 Example flows
Current behavior:
1. press enter (or click on student roll) to open search window, all texts are shown lightly faded
2. type "15" and system displays student with exact match on top, rest that has 15 on student roll are displayed below
3. press enter simply use 15 as number which will get converted 5 digits with internal helper function.
First row: Assign ID: 15(→ 20015)
Second row: Exact Match
(Actual name is displayed here) (user typed input)
Third row: Matches ID
(other criteria rows are displayed here)
Desired behavior:
1. how to trigger stays same as current
2. if user input is number and > 0 always make it 5 digits with internal helper function.
i.e. user input 1 -> internal helper function -> 20001
user input 20 -> internal helper function -> 20020
user input 1077 -> internal helper function -> 21077
So that, first match will be exact match with student roll
3. if it is non-number and Thai alphabet or English alphabet, search by student name
4. press enter > type number > press enter (currently working) should be kept as it is.
5. press enter > type name > user must select row from search result and press enter or click desired row to apply student roll

Note: Editing student roll should be same for both modes, SEQUENTIAL and PRIORITY