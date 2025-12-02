
# SQL doesn't naturally do a "Full Outer Join" 

However, for the Frontend Editor to be truly powerful and "Spreadsheet-like," you definitely want a single unified list.

If you split them into two modes, the workflow breaks:
*   *User sees a Ghost Sheet with Roll `10005`.*
*   *User realizes it belongs to "Somchai" (who is currently listed as "Missing" in the other list).*
*   *User edits the Ghost Sheet to `10002`.*
*   *The Ghost row must disappear, and the "Missing" row for Somchai must turn Green instantly.*

To achieve this, we use a `UNION ALL` query. This combines your "Master List" logic and your "Ghost" logic into one flat data structure for the API.

### 1. The Unified SQL Query (Backend)

This query creates a standardized "Roster Row" that handles every possible state: Matched, Missing, Ghost, Duplicate, and Error.

```sql
-- API: GET /api/tasks/{task_id}/roster

-- PART 1: The Master List (Registration + Matched Sheets)
SELECT 
    'master' as source,
    e.stu_number as master_roll,
    CONCAT(e.firstname, ' ', e.lastname) as student_name,
    e.absent1 as is_absent_in_master,
    s.id as sheet_id,
    s.student_roll as sheet_roll,
    s.error_flags,
    s.original_filename,
    CASE
        WHEN s.id IS NULL AND e.absent1 = 0 THEN 'MISSING'         -- Registered, Present, No Sheet
        WHEN s.id IS NOT NULL AND e.absent1 = 1 THEN 'UNEXPECTED'  -- Registered, Absent, But Sheet Found
        WHEN s.error_flags > 0 THEN 'ERROR'                        -- Matched, but has OCR errors (Dup/ID/etc)
        WHEN s.id IS NOT NULL THEN 'OK'                            -- Perfect match
        ELSE 'ABSENT'                                              -- Registered, Absent, No Sheet (Normal)
    END as row_status,
    -- Debug/Error Message for UI Tooltip
    CASE
        WHEN (s.error_flags & 1) THEN 'Duplicate Sheet'
        WHEN (s.error_flags & 2) THEN 'Too few answers'
        WHEN (s.error_flags & 4) THEN 'ID Out of Range'
        WHEN (s.error_flags & 8) THEN 'Center Code Mismatch'
        WHEN (s.error_flags & 16) THEN 'Group Mismatch'
        WHEN (s.error_flags & 32) THEN 'Level Mismatch'
        WHEN s.id IS NOT NULL AND e.absent1 = 1 THEN 'Marked Absent in DB but Sheet Exists'
        ELSE NULL
    END as error_message
FROM moe67.examinee e
LEFT JOIN omr_sheets s 
    ON e.task_id = s.task_id 
    AND e.stu_number = s.v_student_no -- Mapping logic
    AND s.deleted_at IS NULL
WHERE e.task_id = ?

UNION ALL

-- PART 2: The Ghost List (Sheets with IDs that don't exist in Master)
SELECT 
    'ghost' as source,
    NULL as master_roll,
    'Unknown / Unregistered' as student_name,
    NULL as is_absent_in_master,
    s.id as sheet_id,
    s.student_roll as sheet_roll,
    s.error_flags,
    s.original_filename,
    'GHOST' as row_status,
    'Unknown Student ID' as error_message
FROM omr_sheets s
LEFT JOIN moe67.examinee e
    ON s.task_id = e.task_id
    AND s.v_student_no = e.stu_number
WHERE s.task_id = ?
  AND s.deleted_at IS NULL 
  AND e.stu_number IS NULL  -- Only find ones NOT in master

-- PART 3: Global Sort Order (Critical for UX)
ORDER BY 
    CASE row_status
        WHEN 'GHOST' THEN 1      -- Show Unknown sheets first
        WHEN 'ERROR' THEN 2      -- Show OCR Errors second
        WHEN 'UNEXPECTED' THEN 3 -- Show Absent/Present conflicts third
        WHEN 'MISSING' THEN 4    -- Show Missing students fourth
        WHEN 'OK' THEN 5         -- Show Good data last
        ELSE 6 
    END,
    master_roll ASC;
```

---

### 2. Frontend Data Handling (TanStack Table)

When your frontend receives this JSON, it maps `row_status` to visual styles in the Table.

| Row Status | Visual Style | Action Enabled |
| :--- | :--- | :--- |
| **GHOST** | 🔴 Red Border | User must Edit Roll No or Move Sheet |
| **ERROR** | 🟠 Orange Border | User must Fix OCR error (Dup/ID) |
| **UNEXPECTED** | 🟡 Yellow Bg | User must Confirm: "Is he Present?" or "Delete Sheet" |
| **MISSING** | ⚪ Gray (faded) | User can "Upload Image" or "Mark Absent" |
| **OK** | 🟢 Green Text | Read-only (mostly) |

#### How the "Unified List" helps the user:
**Scenario:** A student named "Somchai" (ID 10005) bubbled his ID as `10006`.
1.  **Initial View:**
    *   Row A: **Somchai (10005)** -> Status: **MISSING** (Gray).
    *   Row B: **Unknown (10006)** -> Status: **GHOST** (Red).
2.  **User Action:**
    *   User clicks Row B (Ghost).
    *   User looks at image, sees name "Somchai".
    *   User changes Roll No from `10006` to `10005`.
3.  **Result (Optimistic UI Update):**
    *   The Grid merges the data.
    *   Row B disappears.
    *   Row A turns **OK (Green)** because it now has a sheet link.

---

### 3. Updated Table Component Columns
Here is how you should define your columns in TanStack Table to handle this unified data.

```tsx
const columns = [
  {
    header: 'Status',
    accessorKey: 'row_status',
    cell: ({ row }) => {
      const status = row.getValue('row_status');
      // Return Icon based on status (Ghost=GhostIcon, Error=AlertTriangle, etc)
    }
  },
  {
    header: 'Master Roll',
    accessorKey: 'master_roll', // From Examinee DB
  },
  {
    header: 'Sheet Roll (Editable)',
    accessorKey: 'sheet_roll', // From OMR Sheet
    cell: ({ row, getValue }) => {
       // If sheet_id is null, show "Upload" button
       // If sheet_id exists, show Editable Input
    }
  },
  {
    header: 'Name',
    accessorKey: 'student_name', 
    // If Status == GHOST, text is gray "Unknown". 
    // Clicking this triggers the "Name Search" we discussed previously.
  },
  {
    header: 'Error Detail',
    accessorKey: 'error_message',
    // Render as a Tooltip or small red text
  }
]
```

This approach gives you the **"Single List"** capability you wanted, satisfying both the need to track missing students and the need to fix bad scans.

### 4. Backend Logic for Updates

When the user clicks "Confirm" or "Mark as Present", you simply update the corrected_flags.
API Endpoint: PATCH /api/sheets/{id}/verify
Python/Backend Logic:

```python
# API: PATCH /api/sheets/{id}/verify
def verify_sheet(sheet_id, action_type):
    # Mapping actions to bits
    FLAGS = {
        'confirm_low_answers': 32, # Bit 5
        'mark_present': 16,        # Bit 4
        'manual_override': 128     # Bit 7
    }
    
    bit_to_set = FLAGS.get(action_type)
    
    # Update Query
    # We use bitwise OR (|) to add the flag without removing others
    sql = "UPDATE omr_sheets SET corrected_flags = corrected_flags | %s WHERE id = %s"
    execute(sql, (bit_to_set, sheet_id))
    
    # Note: No need to recalculate error_flags! 
    # The error remains (e.g., low answers), but the "corrected" flag tells the UI/Grading to ignore it.
```

### 5. Frontend UI Experience
With the SQL above, the Frontend logic becomes very simple because row_status handles the color coding.
Scenario A: Low Answers
Initial: row_status = "ERROR" (Orange). error_message = "Too few answers".
User: Clicks the row.
UI: Shows "Detected 50/150 answers."
Action: User clicks button [Confirm Valid].
API: Sends confirm_low_answers.
Refetch:
row_status becomes "OK" (Green).
error_message becomes "Verified: Low Answer Count".
Scenario B: Absent but Present
Initial: row_status = "UNEXPECTED" (Yellow).
User: Clicks row. Sees warning "Student marked absent in master list."
Action: User clicks button [Mark as Present].
API: Sends mark_present.
Refetch:
row_status becomes "OK" (Green).
