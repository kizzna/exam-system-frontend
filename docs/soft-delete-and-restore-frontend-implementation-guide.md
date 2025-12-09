# Frontend Implementation Guide: Soft Delete & Restore

## Overview
The backend now supports "Recycle Bin" functionality for OMR sheets. The frontend needs to be updated to allow users to view deleted sheets, soft delete active sheets, and restore deleted sheets.

## API Changes

### 1. Get Roster (List Sheets)
The roster endpoint now supports a `status` filter.
*   **Endpoint:** `GET /api/v1/tasks/{task_id}/roster`
*   **Parameter:** `status` (string, optional)
    *   `active` (Default): Shows only active sheets.
    *   `deleted`: Shows only soft-deleted sheets.
    *   `all`: Shows both.

### 2. Batch Delete
*   **Endpoint:** `POST /api/v1/sheets/batch-delete`
*   **Body:**
    ```json
    {
      "sheet_ids": [123, 124]
    }
    ```
*   **Success:** HTTP 200
*   **Effect:** Moves sheets to "deleted" status.

### 3. Batch Restore
*   **Endpoint:** `POST /api/v1/sheets/batch-restore`
*   **Body:**
    ```json
    {
      "sheet_ids": [123, 124]
    }
    ```
*   **Success:** HTTP 200
*   **Error (409 Conflict):** Occurs if restoring a sheet would cause a duplicate (e.g., active sheet with same student ID already exists).

## Implementation Steps (React + TanStack Table)

### 1. State Management
Add a state for the current view mode:
```javascript
const [viewMode, setViewMode] = useState('active'); // 'active' | 'deleted'
```

### 2. Fetching Data
Pass the `viewMode` to your data fetching hook:
```javascript
const { data, refetch } = useQuery(['roster', taskId, viewMode], () => 
  api.get(`/tasks/${taskId}/roster`, { params: { status: viewMode } })
);
```

### 3. Table Toolbar Actions
*   **Switcher:** Add a Toggle or Tabs to switch between "Active Sheets" and "Bin".
*   **Active Mode:**
    *   Show "Delete Selected" button (Red) when rows are selected.
    *   Action: Call `POST /sheets/batch-delete`.
    *   On Success: Clear selection and `refetch()`.
*   **Deleted Mode:**
    *   Background: Consider adding a visual cue (e.g., striped background) to indicate these are deleted items.
    *   Show "Restore Selected" button (Green) when rows are selected.
    *   Action: Call `POST /sheets/batch-restore`.
    *   On Success: Clear selection and `refetch()`.

### 4. Handling Restore Conflicts
If `batch-restore` returns 409:
```javascript
try {
  await api.restore(selectedIds);
} catch (error) {
  if (error.response.status === 409) {
    toast.error("Some sheets could not be restored because active sheets with the same ID already exist.");
  }
}
```
