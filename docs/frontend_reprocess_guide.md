# Frontend Guide for OMR Reprocess Feature

## Overview
The Reprocess Feature allows users to reprocess specific OMR sheets using a different profile. This is useful when the default profile fails to detect bubbles correctly (e.g., too light markings) or when a different sensitivity configuration is needed.

Unlike the normal batch processing, reprocessing **skips the alignment step** and uses static layout coordinates on the already-aligned images stored in the backend.

## API Endpoint

### `POST /sheets/reprocess`

Triggers the reprocess task for a list of sheets. This operation is asynchronous.

### Request Payload

```json
{
  "sheet_ids": [101, 102, 103],
  "profile_id": 2
}
```

- `sheet_ids` (List[int]): Array of Sheet IDs to reprocess.
- `profile_id` (int): ID of the OMR Profile to use.

### Response

```json
{
  "status": "success",
  "message": "Reprocessing triggered successfully"
}
```

## Workflow

1.  **User Selection**: User selects one or more sheets from the student list sequential viewMode using select mode.
2. System shows "Re-Process" ICON on header of Panel C.
3. User clicks on "Re-Process" ICON.
4. System lists available profiles in a modal for user to choose from.
5. User chooses a profile and press "Re-Process" button in the modal.
6. System sends `POST /sheets/reprocess` with the selected IDs and Profile ID.
7. System shows a toast/notification that reprocessing has started.
8. Since the operation is async, the sheet status/data might not update immediately. You may need to refresh the sheet list or poll for updates, although traditionally manual refresh is sufficient.

## Update Logic
The backend updates `omr_answers` and recalculates scores/flags using the stored procedure `REPROCESS_SHEET_SURGICAL`.
- Answers will be overwritten with the new values.
- Only error that affected by this is too few answer flag (bitmask bit 1 value 2). Other affected parts are 3 subject scores.
REPROCESS_SHEET_SURGICAL handles both of these and related error status columns on processing_tasks table.

# Layout:
- Panel C Header: "Re-Process" ICON, only appears when select mode is enabled and at least one sheet is selected.
It'll be placed before this button: {/* Swap Button */}

Note: How long Step 6 reprocess takes depends on the number of sheets.
Normally 2-4 seconds per sheet with full flow and this reprocess should be less than a 1 second per sheet.
Use spinner to indicate that reprocess is in progress accordoing to the number of sheets.
We can change number if it is faster or slower.
