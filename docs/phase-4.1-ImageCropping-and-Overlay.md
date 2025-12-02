# Phase 4.1 Specification: OMR Image Cropping & Overlay

**Version:** 1.0
**Context:** This module connects the File Storage (CephFS), MySQL Data, and the Frontend Editor.

## 1. Backend Specifications (Python/FastAPI)

### A. Coordinate Transformation Logic (The Math)
The database stores **Global Coordinates** (relative to the full original image).
The Frontend displays **Cropped Images**.
The API must return coordinates **Relative to the Crop**.

**Formula:**
$$x_{relative} = x_{global} - x_{crop\_offset}$$
$$y_{relative} = y_{global} - y_{crop\_offset}$$

### B. Endpoint: Get Cropped Image
**Route:** `GET /api/v1/images/{sheet_id}/render`

**Parameters:**
*   `part`: `top` or `bottom`

**Logic:**
1.  **Fetch Path:** Query `omr_sheets` + `omr_batches` to build the full path:
    `/mnt/omr/omr_pool1/completed/{batch_uuid}/{original_filename}`
2.  **Crop & Optimize:**
    *   **Top:** Crop `(105, 40, 105 + 1440, 40 + 595)`
    *   **Bottom:** Crop `(385, 635, 385 + 1170, 635 + 1650)`
    *   *Optimization:* Convert to **WebP (Quality 80)**. This reduces the 1.4MB image to ~50KB for the top header, making the UI snappy.

### C. Endpoint: Get Overlay Metadata
**Route:** `GET /api/v1/images/{sheet_id}/overlay`

**Logic:**
This endpoint returns the **Grid** (where bubbles *are*) and the **Values** (what was *selected*).

**1. Top Part (Header):**
*   Read `id_bubble_positions` (JSON) from `omr_sheets`.
*   Apply offset logic: `x = x - 105`, `y = y - 40`.
*   Return structure mapping field names to array of coordinates.

**2. Bottom Part (Answers):**
*   Read 150 rows from `omr_answers`.
*   Apply offset logic: `x = x - 385`, `y = y - 635`.
*   Map `answer_corrected` (Value) to the specific `circle_N_x/y` column.

**Sample JSON Response:**
```json
{
  "top": {
    "dimensions": {"w": 1440, "h": 595},
    "fields": {
      "class_level": [
         {"val": 1, "x": 887, "y": 180}, // Calculated: 992 - 105
         {"val": 2, "x": 887, "y": 226}, 
         {"val": 3, "x": 887, "y": 272}
      ],
      "student_roll_col_1": [
         {"val": 0, "x": 1224, "y": 144}, 
         {"val": 1, "x": 1224, "y": 188},
         ...
      ]
    },
    "current_values": {
      "class_level": 1,
      "student_roll": "10045"
    },
    "scores": {
      "subject1": 80,
      "subject2": 75,
      "subject3": 90
    }
  },
  "bottom": {
    "dimensions": {"w": 1170, "h": 1650},
    "answers": [
      {
        "q": 1, 
        "val": 2, 
        "correct_val": 2,
        "coords": {"x": 151, "y": 149} // Calculated from circle_2_x - 385
      },
      ...
    ]
  }
}
```

---

## 2. Frontend Specifications (Next.js/React)

### A. The "Smart Image" Component
We use an SVG overlay on top of the Image. The SVG `viewBox` matches the **Cropped Dimensions** (Server-side crop W/H). This ensures alignment works perfectly regardless of the CSS display size on the user's screen.

**Component Structure:**
```tsx
const SmartImage = ({ src, width, height, overlays }) => {
  return (
    <div className="relative" style={{ aspectRatio: `${width}/${height}` }}>
      {/* 1. The Cropped Image */}
      <img src={src} className="w-full h-full object-contain" />
      
      {/* 2. The Interactive Overlay */}
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {overlays.map((bubble) => (
          <circle 
            cx={bubble.x} 
            cy={bubble.y} 
            r="18" // Radius matches original OMR sheet scale
            fill={bubble.active ? "rgba(0, 255, 0, 0.4)" : "transparent"}
            stroke={bubble.active ? "green" : "transparent"}
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
};
```

### B. Handling "Re-Correction"
This is where the "Hybrid" approach shines.

**Scenario:** Editor changes Student Roll Digit 1 from '1' to '2'.

1.  **User Input:** User types '2' in the `student_roll` input field.
2.  **State Update:** React state updates `current_values.student_roll` to "2....".
3.  **Render Cycle:**
    *   The `SmartImage` component re-renders.
    *   It looks at `fields.student_roll_col_1`.
    *   It finds the coordinate for `val: 2`.
    *   The Green SVG Circle **instantly moves** to the '2' position.
4.  **Visual Confirmation:** The editor immediately sees if the Green Circle matches the pencil mark on the background image. If it aligns, the correction is valid.

---

## 3. Implementation Plan for Developers

### Step 1: Backend Implementation (Completed)

The backend implementation follows Domain-Driven Design (DDD) and is located in `src/domains/sheets`.

**Endpoints:**
*   `GET /api/sheets/{sheet_id}/image?part={top|bottom}`: Returns the cropped WebP image.
*   `GET /api/sheets/{sheet_id}/overlay`: Returns the overlay metadata JSON.

**Code Location:**
*   **Router:** `src/api/routers/sheets.py`
*   **Service:** `src/domains/sheets/service.py`
*   **Repository:** `src/domains/sheets/repository.py`
*   **Models:** `src/domains/sheets/models.py`
*   **Schemas:** `src/domains/sheets/schemas.py`


### Step 3: Frontend Integration
1.  **Layout:** Use the grid layout (we already have it).
2.  **State:** Load the `overlay-data` JSON once when the sheet is selected.
3.  **Sync:** When `TanStack Table` row updates, pass the new values into the `SmartImage` component props to trigger the SVG update.

    