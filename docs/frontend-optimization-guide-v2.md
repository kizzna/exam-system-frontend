# Frontend Optimization Guide: Instant Sheet Updates

## Overview
We have optimized the backend to perform "surgical" updates when sheet information (like Student Roll, Class, or Task) changes. This logic is designed to support **Optimistic UI Updates** on the frontend, making the application feel instant.

## Backend Changes (V2)
The `PATCH /sheets` endpoint now returns the updated sheet **AND** any other sheets affected by the change (side-effects).
- **Previous Behavior**: Returned only the updated sheet. If a duplicate was created, the *other* sheet remained "valid" in the UI until a refresh.
- **New Behavior**: Returns the updated sheet + any sibling sheets that were potentially healed (widow healing) or collided with (duplicate detection).

## Frontend Implementation Logic

### 1. Optimistic Update (Immediate Feedback)
When a user edits a cell (e.g., changes Roll from `10001` to `10002`):
1.  **Immediately** update the local state for that row to `10002`.
2.  If `10002` already exists in the local list:
    - Mark *both* the edited row and the existing row as "Duplicate" visually (e.g., red background) immediately.
3.  Send the API request in the background.

### 2. Handling the Response
The API returns a list of `RosterRow` objects. **Upsert** these rows into your local state by `sheet_id`.

```javascript
// Example Response Handling
const updatedRows = await api.updateSheet(sheetId, { student_roll: "10002" });

// updatedRows contains:
// 1. The sheet you edited (sheetId) with new calculated flags.
// 2. The sheet that was previously a duplicate of this one (if any) -> Now "Healed" (OK status).
// 3. The sheet that this new value collides with (if any) -> Now "Duplicate" status.

useStore.setState(state => {
  const newRoster = { ...state.roster };
  
  updatedRows.forEach(row => {
    // Upsert logic: Update only the specific rows returned by backend
    newRoster[row.sheet_id] = row;
  });
  
  return { roster: newRoster };
});
```

### 3. Key Scenarios to Test

#### A. Creating a Duplicate
- **Action**: Change Roll of Sheet A to match Sheet B.
- **Optimistic**: Show both A and B as red.
- **Response**: API returns A (Duplicate) and B (Duplicate). State updates confirm the optimistic UI.

#### B. Fixing a Duplicate
- **Action**: Change Roll of Sheet A (which is currently a duplicate of B) to a unique value.
- **Optimistic**: Show A as white (OK). Show B as white (OK) *if B has no other duplicates*.
- **Response**: API returns A (OK) and B (OK).
    - *Note*: The backend checks B's status. If B still shares a roll with Sheet C, B will remain Duplicate, and C won't be returned (unless it was A's old value, which isn't the case here).

#### C. Moving to another Task
- **Action**: Change Sheet A's `task_id`.
- **UI Behavior**: Sheet A should disappear from the current list (since the list is usually filtered by Task).
- **Response**: API returns Sheet A with new Task ID. Remove it from the current view.
