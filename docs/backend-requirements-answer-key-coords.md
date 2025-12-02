# Backend Requirements: Correct Answer Coordinates

## Objective
Enable the Frontend OMR Editor to display the **Correct Answer Overlay** (green check/circle) on the student's sheet **even when the student has not answered** or has answered incorrectly but the specific bubble coordinates are missing.

## Current Limitation
Currently, the `GET /sheets/{id}/overlay` endpoint returns `coords` derived from the **student's** answer sheet (`omr_answers` table).
- If the student marks an answer, we get `coords` and can draw the overlay.
- If the student **does not mark** an answer (or it's not detected), `coords` is `null`.
- Consequently, the frontend cannot show *where* the correct answer should have been, because it doesn't know the physical location (x, y) of the correct bubble on the sheet.

## Proposed Solution
We need to store the physical coordinates (x, y) of the **correct answer bubbles** from the **Master Answer Key** sheet and return them in the API.

### 1. Database Schema Changes

**Table:** `answer_key_answers`

Add columns to store the coordinates of the correct answer bubble.

```sql
ALTER TABLE answer_key_answers
ADD COLUMN bubble_x smallint UNSIGNED NULL,
ADD COLUMN bubble_y smallint UNSIGNED NULL;
```

*Note: These coordinates should represent the centroid of the correct answer bubble extracted during the Answer Key scanning process.*

### 2. Answer Key Processing Logic
When scanning/processing the **Answer Key Sheet**:
1.  Identify the marked bubble (the correct answer).
2.  Extract its centroid coordinates (x, y).
3.  Save these coordinates into `answer_key_answers.bubble_x` and `answer_key_answers.bubble_y`.

### 3. API Changes

**Endpoint:** `GET /sheets/{sheet_id}/overlay`

Update the response structure for `bottom.answers` to include `correct_coords`.

**Current Response Item:**
```json
{
    "q": 4,
    "val": null,
    "correct_val": 8,
    "coords": null  // Student didn't answer, so no coords
}
```

**New Response Item:**
```json
{
    "q": 4,
    "val": null,
    "correct_val": 8,
    "coords": null, // Student didn't answer
    "correct_coords": { // <--- NEW FIELD
        "x": 1234,
        "y": 5678
    }
}
```

**Logic:**
- Join `omr_sheets` with `omr_answer_keys` (via batch/exam session) to find the applicable Answer Key.
- Join with `answer_key_answers` to get `bubble_x` and `bubble_y` for each question.
- Populate `correct_coords` in the JSON response.

## Impact
- **Frontend**: Can now render a "Ghost" overlay showing the correct answer location even if the student left it blank.
- **User Experience**: Teachers can instantly see which bubble *should* have been marked.
