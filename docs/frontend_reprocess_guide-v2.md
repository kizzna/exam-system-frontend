# OMR Reprocess Feature - Frontend Guide

## Overview
This feature allows an Editor to reprocess selected OMR sheets using a specific Profile. This is useful when the default profile fails to read the sheet correctly (e.g., lightly filled bubbles).

## API Endpoints

### 1. Trigger Reprocess
**URL:** `POST /sheets/reprocess`
**Content-Type:** `application/json`

**Payload:**
```json
{
  "sheet_ids": [12345, 12346],
  "profile_id": 2
}
```

- `sheet_ids`: Array of integers (Sheet IDs to reprocess).
- `profile_id`: Integer (Profile ID to use, e.g., 2 for "Sensitive").

**Response (Success):**
```json
{
  "status": "success",
  "message": "Reprocessing triggered successfully",
  "task_id": "c8f2b3c4-..."
}
```

### 2. Track Progress (Real-time SSE)
**URL:** `GET /sheets/reprocess/{task_id}/stream`
**Type:** Server-Sent Events (SSE)

This provides detailed real-time feedback (Processing X/Y sheets, generating CSV, etc.), identical to the Batch Upload progress stream.

**Events:**
- `progress`: Contains percentage and status message.
- `complete`: Task finished successfully.
- `error`: Task failed.

**Example (JavaScript):**
```javascript
const taskId = "c8f2b3c4-...";
const eventSource = new EventSource(`/api/sheets/reprocess/${taskId}/stream`);

eventSource.addEventListener('progress', (e) => {
    const data = JSON.parse(e.data);
    console.log(`Stage: ${data.stage} | ${data.progress_percentage}%`);
    // Update UI progress bar
});

eventSource.addEventListener('complete', (e) => {
    console.log("Done!");
    eventSource.close();
    // Refresh sheet list
});

eventSource.addEventListener('error', (e) => {
    console.error("Error", e);
    eventSource.close();
});
```

### 3. Check Status (Polling Fallback)
**URL:** `GET /sheets/reprocess/{task_id}/status`

**Response:**
```json
{
  "task_id": "c8f2b3c4-...",
  "status": "PENDING" | "STARTED" | "SUCCESS" | "FAILURE",
  "result": { ... } 
}
```

## Backend Logic
-   **Task:** `reprocess_omr_sheet_task` (Async Celery Task).
-   **Updates:**
    -   Reads the original aligned image.
    -   Detects bubbles using the new profile's sensitivity settings.
    -   Publishes progress events to Redis (Consumed by SSE endpoint).
    -   Updates `omr_answers` table with new `answer_raw`, `answer_corrected`, and `confidence_score`.
    -   Calls `REPROCESS_SHEET_SURGICAL` stored procedure to recalculate scores and flags.
-   **Optimization:** Uses bulk CSV loading for high performance.

# Layout:
- Panel C Header: "Re-Process" ICON, only appears when select mode is enabled and at least one sheet is selected.
It'll be placed before this button: {/* Swap Button */}

## Workflow

1.  **User Selection**: User selects one or more sheets from the student list sequential viewMode using select mode.
2. System shows "Re-Process" ICON on header of Panel C.
3. User clicks on "Re-Process" ICON.
4. System lists available profiles in a modal for user to choose from.
5. User chooses a profile and press "Re-Process" button in the modal.
6. System sends `POST /sheets/reprocess` with the selected IDs and Profile ID.
7. System show real-time progress in a modal similar to the batch processing modal
Refer to: /workspaces/omr-frontend/components/batches/BatchDetailsCard.tsx
at section: {/* Progress (SSE-based real-time streaming) - Only for active batches or when finishing up */}.
This sample log on browser from batch upload and our modal should show something similar with Scrollable Activity Log:
Processing Progress✓ Complete	Activity Log	3:55:26 PM	0s	[Extracting ZIP] Starting extraction	3:55:44 PM	18s	[Extracting ZIP] Extraction complete - 7109 sheets	100%
3:55:45 PM	18s	[Processing Sheets] Creating sheet records	3:55:58 PM	31s	[Processing Sheets] Dispatching 7109 tasks to workers	3:56:09 PM	43s	[Processing Sheets] Processing: 324/7109 sheets completed	5%
3:56:16 PM	50s	[Processing Sheets] Processing: 580/7109 sheets completed	8%
3:56:23 PM	57s	[Processing Sheets] Processing: 1156/7109 sheets completed	16%
3:56:31 PM	1m 5s	[Processing Sheets] Processing: 1722/7109 sheets completed	24%
3:56:38 PM	1m 12s	[Processing Sheets] Processing: 2232/7109 sheets completed	31%
3:56:46 PM	1m 20s	[Processing Sheets] Processing: 2766/7109 sheets completed	39%
3:56:53 PM	1m 27s	[Processing Sheets] Processing: 3337/7109 sheets completed	47%
3:57:01 PM	1m 35s	[Processing Sheets] Processing: 3907/7109 sheets completed	55%
3:57:08 PM	1m 42s	[Processing Sheets] Processing: 4500/7109 sheets completed	63%
3:57:16 PM	1m 50s	[Processing Sheets] Processing: 5154/7109 sheets completed	72%
3:57:24 PM	1m 58s	[Processing Sheets] Processing: 5727/7109 sheets completed	81%
3:57:32 PM	2m 6s	[Processing Sheets] Processing: 6261/7109 sheets completed	88%
3:57:40 PM	2m 14s	[Processing Sheets] Processing: 6875/7109 sheets completed	97%
3:57:44 PM	2m 18s	[Processing Sheets] All 7109 tasks completed (0 failed)	100%
3:57:44 PM	2m 18s	[Collecting Results] Collecting worker results	3:57:56 PM	2m 30s	[Collecting Results] Collected 7109 results	100%
3:57:56 PM	2m 30s	[Generating CSV Files] Generating CSV files	3:57:58 PM	2m 32s	[Generating CSV Files] CSV generation complete: 7109 sheets, 1066350 answers	100%
3:57:58 PM	2m 32s	[Loading to Database] Loading to database	3:58:31 PM	3m 5s	[Loading to Database] Database load complete: 7109 sheets, 1066350 answers in 31675ms	100%
3:58:31 PM	3m 5s	[Cleanup] Cleaning up batch files	3:58:41 PM	3m 15s	[Completed] Batch completed successfully	100%
8. User press close button on modal.
9. System refreshes the sheet list.
