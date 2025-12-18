Frontend Integration Guide: Audit Log System
Overview
The new Audit Log system allows administrators to view all system activities and users to view their own actions.

API Endpoints
1. List Audit Logs
GET /audit-logs

Permissions:

Admin: Returns all audit logs.
User: Returns only audit logs for the current user.
Query Parameters (Filters):

Parameter	Type	Description	Example
page	int	Page number (default: 1)	1
size	int	Items per page (default: 50)	20
action
string	Filter by action type	LOGIN, BATCH_IMPORT, SHEET_UPDATE
resource_type	string	Filter by resource type	
user
, 
batch
, sheet, task
resource_id	string	Filter by specific resource ID	1024, batch-uuid-123
username	string	(Admin Only) Filter by username	johndoe
start_date	iso8601	Filter logs after this date	2023-10-01T00:00:00Z
end_date	iso8601	Filter logs before this date	2023-10-31T23:59:59Z
Response Format:

{
  "items": [
    {
      "id": 123,
      "action": "BATCH_IMPORT",
      "resource_type": "batch",
      "resource_id": "b-123-uuid",
      "user": {
        "id": 45,
        "username": "admin_user",
        "email": "admin@example.com"
      },
      "details": {
         "filename": "exam_results.zip",
         "sheet_count": 500
      },
      "ip_address": "192.168.1.1",
      "created_at": "2023-10-27T10:30:00.000000"
    }
  ],
  "total": 50,
  "page": 1,
  "size": 20,
  "pages": 3
}
2. Audit Log Types (Actions)
Use these keys for filtering or displaying icons/labels.

Action Key	Display Label	Description
LOGIN	Login	User logged into the system
BATCH_IMPORT	Batch Import	New batch file uploaded
SHEET_UPDATE	Sheet Edit	OMR sheet data modified (e.g. valid student ID)
TASK_UPDATE	Task Update	Changes to task statistics (e.g. sheet processed)
TASK_SWAP	Task Swap	Sheets moved between tasks
SHEET_RELOCATE	Sheet Relocate	Single sheet moved to another task
SHEET_RESTORE	Sheet Restore	Deleted sheet restored
SHEET_DELETE	Sheet Delete	Sheet soft-deleted
UI Recommendations
Admin Dashboard: Add an "Audit Logs" tab.
Detail Views:
In "Task Details", show a "History" tab filtering resource_type=task & resource_id={taskId}.
In "Batch Details", show history filtering resource_type=batch & resource_id={batchId}.
Diff View: The details field (and old_values/new_values in backend) can be used to show what changed. For now, a simple JSON view or "Field X changed from A to B" is sufficient.



# api response example:
{
    "items": [
        {
            "id": 1046,
            "user_id": null,
            "action": "SHEET_UPDATE",
            "resource_type": "sheet",
            "resource_id": "1114951",
            "old_values": {
                "task_id": 10200113,
                "is_active": 1,
                "class_group": 3,
                "class_level": 1,
                "error_flags": 4,
                "student_roll": 30047,
                "exam_center_code": 102001
            },
            "new_values": {
                "task_id": 10200113,
                "is_active": 1,
                "class_group": 3,
                "class_level": 1,
                "error_flags": 0,
                "student_roll": 30047,
                "exam_center_code": 102001
            },
            "ip_address": null,
            "user_agent": null,
            "created_at": "2025-12-18 17:36:30"
        },
        /* ... */
    ],
    "total": 993,
    "page": 1,
    "size": 20,
    "pages": 50
}