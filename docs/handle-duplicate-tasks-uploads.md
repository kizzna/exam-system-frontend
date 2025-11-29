# Frontend Guide: Handling Skipped Duplicate Tasks

## Overview
The backend now detects and skips duplicate sheet uploads at the `task_id` level. If a user uploads a batch containing sheets for a task that already exists in the system, those sheets will be skipped, and the user will be notified via the progress stream.

## Progress Events
The backend sends progress updates via Server-Sent Events (SSE). When duplicate tasks are detected, a specific event is emitted during the `EXTRACTING` stage.

### Event Structure
The event will have the following properties:
- `stage`: `EXTRACTING`
- `message`: "Skipping {count} duplicate tasks: {task_id_1}, {task_id_2}, ..."
- `progress_percentage`: 0.0

### Example Payload
```json
{
  "stage": "extracting",
  "message": "Skipping 2 duplicate tasks: 10300112, 10300122",
  "progress_percentage": 0.0,
  "timestamp": "2023-10-27T10:00:00.123456"
}
```

## Recommended UI Handling
1.  **Monitor Progress Stream**: Listen for events where `message` starts with "Skipping".
2.  **Display Warning**: When such an event is received, display a warning to the user.
    - **Color**: Red or Orange (Warning/Error style).
    - **Location**: Near the progress bar or in a toast notification.
    - **Content**: "Warning: Some tasks were skipped because they already exist: 10300112, 10300122"

## Notes
- This is a non-blocking warning. The rest of the batch (if any valid tasks remain) will continue to process normally.
- The skipped files are not deleted immediately but will be cleaned up during the batch cleanup phase.
