# Phase 5.1: Sequential View & Rapid Correction

**Context:**
We are implementing a specific workflow for high-speed correction based on the physical order of scanned sheets.
*   **API:** Backend endpoints (`PATCH /sheets/info`) are ready.
*   **Data Source:** The Unified Roster (ghosts + missing + matched) from Phase 4.

## 1. View Modes Logic

The table must support two distinct sorting/filtering modes.

### A. Priority View (Existing)
*   **Sort:** Status (Error -> Ghost -> Unexpected...).
*   **Filter:** Show ALL rows (Sheets AND Missing Students).

### B. Sequential View (New Implementation)
*   **Sort:** `original_filename` ASC (Physical scan order).
*   **Filter:** `sheet_id IS NOT NULL`.
    *   **Hide** rows that are purely "MISSING" (Students who have no sheet).
    *   **Show** rows that are "GHOST", "ERROR", "UNEXPECTED", or "OK" (Anything with a physical file).
*   **Goal:** The user sees the digital representation of the physical paper stack.

---

## 2. The "Smart Input" Workflow

**Scenario:**
1.  User sees sequence: `Roll 14` -> `Roll 95 (Error: Dup)` -> `Roll 16`.
2.  User deduces that `95` is actually `15` (Student omitted the prefix `200` or bubbled wrong).
3.  User focuses the "Roll No" cell for the error row.

### Step-by-Step Implementation

#### 1. Input Handling
*   **Component:** `Combobox` (Editable Input + Dropdown).
*   **User Action:** Types "15".
*   **Search Logic:** Filter the **Full Master Roster** (including the invisible "Missing" students) for:
    *   `student_roll` starts with "15" OR
    *   `student_roll` ends with "15" OR
    *   `student_roll` contains "15".

#### 2. The Dropdown
Display matches with their current status:
*   *Match 1:* "Somchai (20015) - **Status: MISSING**" (Target)
*   *Match 2:* "David (200150) - **Status: OK**" (Warning: Duplicate risk)

#### 3. Selection & Execution
**User Action:** Selects "Somchai (20015)".

**Frontend Logic (Optimistic):**
1.  **Identify Target:** We are assigning the current sheet (Physical File X) to Master Student `20015`.
2.  **API Call:**
    ```javascript
    PATCH /api/v1/sheets/info
    {
      "sheet_ids": [current_sheet_id],
      "updates": { "student_roll": "20015" }
    }
    ```
3.  **Local State Update (Immediate):**
    *   Find the "Missing" record for 20015 in your local store.
    *   Update it to include `sheet_id`, `original_filename` from the current row.
    *   Update its status to `OK`.
    *   **Visual Result:** The row that *was* "Roll 95" now displays "Roll 20015 (Somchai)" and turns Green. It stays in the same physical position (between 14 and 16).

---

## 3. Keyboard Navigation ("Next Error")

To enable mouse-free correction, we need a custom key handler.

**Requirement:**
When the user is in the "Roll No" input field, if they press a specific key (e.g., `N` or `Enter` on a valid row), jump to the next problem.

**Logic:**
```typescript
const handleKeyDown = (e: React.KeyboardEvent, currentRowIndex: number) => {
  // If user types a number, let them type.
  if (/[0-9]/.test(e.key)) return;

  // Shortcut: 'N' for Next Error
  if (e.key.toLowerCase() === 'n') {
    e.preventDefault();
    
    // Scan forward from current index
    const nextErrorIndex = flatRows.findIndex((row, idx) => {
      if (idx <= currentRowIndex) return false;
      const status = row.original.row_status;
      // Stop at anything that needs attention
      return ['ERROR', 'GHOST', 'UNEXPECTED'].includes(status);
    });

    if (nextErrorIndex !== -1) {
      // Focus the Roll Input of that row
      focusRow(nextErrorIndex);
      // Scroll row into view
      virtualizer.scrollToIndex(nextErrorIndex, { align: 'center' });
    }
  }
};
```

---

## 4. Handling "Unexpected" (Absent but Present)

In Sequential View, you will encounter rows that look like:
`Roll 45 (Status: UNEXPECTED - Marked Absent)`

**Workflow:**
1.  User navigates to Roll 45.
2.  User checks image (Student signature exists).
3.  **Action:** User needs a quick way to "Mark Present" without leaving the flow.
4.  **Implementation:**
    *   Add a small **Action Button** inside the Roll Cell or right next to it.
    *   **Hotkey:** `Ctrl + Enter` when focused on this row.
    *   **API:** Calls `PATCH /sheets/{id}/verify` refer to Full Api docs below. Send `marked_present: true`.

## 5. Handling "ERROR" with error_flags has bit 2 set (Too few answers)

In Sequential View, you will encounter rows that look like:
`Roll 60 (Status: ERROR - Too few answers)`

**Workflow:**
1.  User navigates to Roll 60.
2.  User checks image (Confirms that user left > 10 answers blank).
3.  **Action:** User needs a quick way to "Too few answers" without leaving the flow.
4.  **Implementation:**
    *   Add a small **Action Button** inside the Roll Cell or right next to it.
    *   **Hotkey:** `Ctrl + Enter` when focused on this row.
    *   **API:** Calls `PATCH /sheets/{id}/verify` refer to Full Api docs below. Send `too_few_answers: true`.

### Verify Sheet (Set Corrected Flags)
**Endpoint**: `PATCH /sheets/{sheet_id}/verify`

Use this endpoint to toggle verification flags such as marking a student as present despite roster status, or overriding other error flags.

### Payload
```json
{
  "corrected_flags": {
    "marked_present": true,       // Sets/Clears bit 16
    "manual_corrected": true,     // Sets/Clears bit 128
    "passed_by_policy": false,    // Sets/Clears bit 64
    "too_few_answers": true       // Sets/Clears bit 32
  }
}
```
*   `corrected_flags`: Dictionary where keys are flag names and values are booleans (true to set, false to clear).
*   **Flag Mapping**:
    *   `marked_present` -> Bit 16 (Present but marked absent in roster)
    *   `too_few_answers` -> Bit 32 (Confirm < 141 answers)
    *   `passed_by_policy` -> Bit 64 (Administrative override)
    *   `manual_corrected` -> Bit 128 (General manual correction)
---

## 6. Summary of Sequential View Behavior

| Feature | Implementation Detail |
| :--- | :--- |
| **Sorting** | Strictly `original_filename` ASC. Do not re-sort when ID changes. |
| **Row Visibility** | `sheet_id !== null` (Hide Missing students). |
| **Roll Editing** | Search against Full Roster (including Hidden/Missing). |
| **Correction** | Changing ID visually transforms the *current* row into the *target* student. |
| **Navigation** | 'N' key skips 'OK' rows and lands on next Red/Orange/Yellow row. |

## 7. Integration Notes

*   **API Endpoint:** Use the newly provided `PATCH /sheets/info` for changing the Roll Number.
*   **API Endpoint:** Use the newly provided `PATCH /sheets/{id}/verify` for correcting flags.
*   **Response Handling:** The API returns `success`. The frontend must manually patch the local React Query cache to reflect the change instantly (don't wait for refetch).
*   **Virtualization:** Ensure `scrollToIndex` works reliably with your TanStack Virtual setup so the "Jump to Next Error" doesn't fail if the target is off-screen.