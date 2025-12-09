Tasks page: http://omr-frontend-dev.gt:3000/dashboard/tasks
- This page has filtering system
url: http://gt-omr-api-1.gt:8000/tasks/?error_count=10&page=1&size=50&sort_by=error_count&sort_order=desc
payload:
error_count
10
page
1
size
50
sort_by
error_count
sort_order
desc
response:
{
    "items": [
        {
            "task_id": 14900322,
            "exam_center_code": 149003,
            "class_group": 2,
            "class_level": 2,
            "eval_center_id": 1,
            "processing_status": "pending",
            "registered_amount": 376,
            "present_amount": 313,
            "actual_sheet_count": 313,
            "assigned_user_id": null,
            "error_count": 12,
            "created_at": "2025-11-15T19:15:07",
            "latest_batch_id": 10639,
            "err_duplicate_sheets_count": 8,
            "err_low_answer_count": 0,
            "err_student_id_count": 2,
            "err_exam_center_id_count": 0,
            "err_class_group_count": 0,
            "err_class_level_count": 0,
            "err_absent_count": 2,
            "access_source": null,
            "user_role": null
        },
        /* ... */
    ],
    "total": 8,
    "page": 1,
    "size": 50,
    "pages": 1
}

From this page, it has a button that opens review process for this task i.e.:
http://omr-frontend-dev.gt:3000/dashboard/sheets/review/14900221

What information is needed to send together with this request to get following functionality:
- Task navigation: Previous Task and Next Task buttons
- If user filtered rows with certain criteria, had 3 pages, 50 tasks per page, total items of 130.
That means 50 + 50 + 30 = 130.
User click task review button on task id 14900412, which was 7th task in this list.
From review page, user click next task button. It should open next task id of same filtered list.
From review page, user click previous task button. It should open previous task id of same filtered list.

Navigator location should be around header area of Panel A: near this line: {/* Exam Center Details */}
