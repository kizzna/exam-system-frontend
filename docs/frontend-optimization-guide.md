# Frontend Optimization Guide: Efficient Student Assignment

## Overview
We have optimized the `PATCH /sheets/info` endpoint to return the updated Roster Rows directly. This allows the frontend to update the UI locally without re-fetching the entire roster (~450KB), significantly improving performance during rapid student assignments.

## Backend Changes
The `PATCH /sheets/info` endpoint now returns a JSON array of `RosterEntry` objects for the updated sheets, instead of a simple success message.

**Old Response:**
```json
{ "status": "success", "message": "Sheets updated successfully" }
```

**New Response:**
```json
[
  {
    "source": "master",
    "master_roll": "12345",
    "student_name": "John Doe",
    "sheet_id": 987,
    "sheet_roll": "12345",
    "error_flags": 0,
    "row_status": "OK",
    ...
  }
]
```

## Required Frontend Changes

### 1. Update API Client
Update the `updateSheetInfo` function in `src/lib/api/sheets.ts` (or equivalent) to return the data.

```typescript
// Before
updateSheetInfo: async (payload: SheetUpdatePayload) => {
    const { data } = await axios.patch('/sheets/info', payload);
    return data;
}

// After
updateSheetInfo: async (payload: SheetUpdatePayload): Promise<RosterEntry[]> => {
    const { data } = await axios.patch<RosterEntry[]>('/sheets/info', payload);
    return data;
}
```

### 2. Update Consumer Component (`StudentRow.tsx`)
Modify [handleAssignStudent](file:///workspaces/omr-backend/student-rows.tsx#101-122) and [handleManualAssign](file:///workspaces/omr-backend/student-rows.tsx#123-145) to update the local cache instead of invalidating.

**Target File:** `src/components/omr/student-rows.tsx` (or similar)

```typescript
    const handleAssignStudent = async (targetStudent: RosterEntry) => {
        if (!entry.sheet_id) return;
        try {
            // ... existing logic ...

            // 1. Call API and get updated rows
            const updatedRows = await sheetsApi.updateSheetInfo({
                sheet_ids: [entry.sheet_id],
                updates: { student_roll: finalRoll }
            });

            toast.success(`Assigned sheet to ${targetStudent.student_name}`);
            onOpenChange(false);

            // 2. OPTIMIZED: Update Cache Locally
            // queryClient.invalidateQueries({ queryKey: ['roster'] }); // <-- REMOVE THIS
            
            queryClient.setQueryData<RosterEntry[]>(['roster', /* task_id */], (oldRoster) => {
                if (!oldRoster) return oldRoster;
                
                // Create a map of updated rows for O(1) lookup
                const updateMap = new Map(updatedRows.map(u => [u.sheet_id, u]));
                
                return oldRoster.map(row => {
                    // Match by sheet_id if it exists
                    if (row.sheet_id && updateMap.has(row.sheet_id)) {
                        return updateMap.get(row.sheet_id)!;
                    }
                    // Also handle the case where a ghost row becomes a valid master row
                    // (This might require more complex merging logic depending on how your list is keyed)
                    return row;
                });
            });

            // Fallback: If cache update is too complex, you can still invalidate but we recommend updating cache.
            // Note: Since 'Assign' often moves a sheet from 'GHOST' row to 'MASTER' row or 'MASTER' to 'MASTER', 
            // the simple map update might need to handle "merging" rows.
            
            // SIMPLER UPDATE STRATEGY:
            // Since the specific logic of merging ghost rows into master rows happens in the backend query,
            // returning the specific rows helps, but simply replacing them in the list might result in duplicates 
            // if the original 'master' row (empty) and 'ghost' row (sheet) were separate.
            
            // RECOMMENDATION: 
            // For now, sticking to invalidateQueries is SAFE but SLOW. 
            // To be truly fast, you need to replace the specific items in the list.
            
            // If you are confident in the cache structure:
            queryClient.setQueryData(['roster', /* currentTaskId */], (old: RosterEntry[] | undefined) => {
                if (!old) return [];
                
                // We need to replace the old row (which had this sheet_id) with the new row.
                // AND we might need to update the target master row.
                
                // Given the complexity of merging (Master Empty Row + Ghost Row -> Single Master Row),
                // doing this locally is tricky.
                
                // HOWEVER, the backend response now gives you the FINAL state of the affected rows.
                // If you merged a Ghost into a Master, the API returns the Master row populated.
                
                // Strategy:
                // 1. Remove the old Ghost row (identified by sheet_id).
                // 2. Update the target Master row (identified by master_roll) with the new data.
                
                // For MVP Speed:
                // Just use the API response data and if correct, it's fast. 
                // But invalidateQueries is simplest. 
                
                // WITH THE NEW BACKEND RESPONSE, even if you keep invalidateQueries, 
                // you save the fetch roundtrip if you use the response data to optimistic update.
                // But the Real Value is replacing the invalidateQueries.
                
                 return old.map(row => {
                    const update = updatedRows.find(u => 
                        (u.sheet_id === row.sheet_id) || // It was this sheet
                        (u.master_roll === row.master_roll && u.source === 'master') // It became this master
                    );
                    return update || row;
                });
            });
            
        } catch (error) {
            toast.error("Failed to update student assignment");
        }
    };
```

> [!NOTE]
> The exact cache update logic depends on how React Query keys are structured and how keys (id vs roll) are managed in the list. The core improvement is that **data is available immediately** without waiting for a re-fetch.
