# Disable update on finalized task

When a task result is published, the task is finalized and cannot be updated.
Backend has a flag `is_finalized` on `Task` model to indicate this status.

## UI changes

- Task list page:
    - button "คำนวณสถิติใหม่" is disabled when a task in selection has `is_finalized` set to true
    (This requires selecting a task first)
    - button "คำนวณสถิติใหม่ (กองงาน)" is disabled when a filtered task has `is_finalized` set to true
    (This does not require selecting a task but activated when a evaluation center is selected)

http://omr.gt/dashboard/sheets/review/
- Sheet review page:
    This page has this request:
    Request URL
http://omr.gt/api/tasks/10101533
Which has response:
{
    "task_id": 10101533,
    /* ... */
    "is_finalized": false
}
    - Any button or action that updates a sheet is disabled when `is_finalized` is true
    Some action does not require selecting a sheet i.e. direct image upload which should be disabled when `is_finalized` is true    

## Task without published result (not finalized):
Request URL
http://omr.gt/api/tasks?page=1&size=50&sort_by=error_count&sort_order=desc
Response:
{
    "items": [
        {
            "task_id": 10101533,
            /* ... */
            "registered_amount": 18,
            "present_amount": 14,
            "actual_sheet_count": 14,
            "assigned_user_id": null,
            "error_count": 0,
            "created_at": "2025-12-18T20:13:59",
            "latest_batch_id": 11301,
            "err_duplicate_sheets_count": 0,
            "err_low_answer_count": 0,
            "err_student_id_count": 0,
            "err_exam_center_id_count": 0,
            "err_class_group_count": 0,
            "err_class_level_count": 0,
            "err_absent_count": 0,
            "trash_count": 0,
            "access_source": null,
            "user_role": null,
            "review_results": 0,
            "is_finalized": false
        },
        /* ... */
    ],
    "total": 25581,
    "page": 1,
    "size": 50,
    "pages": 512
}

## Task with published result (finalized):
Request URL
http://omr.gt/api/tasks?task_id=316067&eval_center_id=105&page=1&size=50&sort_by=error_count&sort_order=desc
Response:
{
    "items": [
        {
            "task_id": 31606711,
            /* ... */
            "registered_amount": 24,
            "present_amount": 24,
            "actual_sheet_count": 0,
            "assigned_user_id": null,
            "error_count": 0,
            "created_at": "2025-12-18T20:13:59",
            "latest_batch_id": null,
            "err_duplicate_sheets_count": 0,
            "err_low_answer_count": 0,
            "err_student_id_count": 0,
            "err_exam_center_id_count": 0,
            "err_class_group_count": 0,
            "err_class_level_count": 0,
            "err_absent_count": 0,
            "trash_count": 0,
            "access_source": null,
            "user_role": null,
            "review_results": 0,
            "is_finalized": true
        },
	/* ... */
    ],
    "total": 3,
    "page": 1,
    "size": 50,
    "pages": 1
}
