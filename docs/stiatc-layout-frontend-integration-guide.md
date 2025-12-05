# OMR Frontend Integration Guide

This guide explains how to implement the OMR sheet visualization using the Static Layout + Dynamic Overlay approach.

## Overview

The goal is to render OMR sheets with overlay data (student answers, correct answers, header info) efficiently.
Instead of sending coordinates for every bubble in every API response, we use a **Static Layout** (cached) and **Dynamic Values** (per sheet).

### Global Coordinate System

All coordinates in the layout (bubble positions, crop definitions) are absolute values based on the original OMR sheet resolution: **1653px x 2338px** (approx. 200 DPI).
- `meta.original_width`: 1653
- `meta.original_height`: 2338
- `meta.bubble_radius_px`: 15

When rendering crops, you must translate these absolute coordinates relative to the crop's origin.

## 1. Fetching the Static Layout

The static layout defines the positions of all bubbles on the OMR sheet. This should be fetched once and cached (or bundled with the app).

**Endpoint:** `GET /sheets/layout`

**Response Structure:**
```json
{
  "meta": {
    "exam_year": 2025,
    "original_width": 1653,
    "original_height": 2338,
    "bubble_radius_px": 15
  },
  "config": {
    "top": { "crop_x": 105, "crop_y": 40, "crop_w": 1440, "crop_h": 595 },
    "bottom": { "crop_x": 385, "crop_y": 635, "crop_w": 1170, "crop_h": 1650 }
  },
  "header_layout": {
    "id_class_level": [
      { "val": "1", "x": 916, "y": 220 },
      ...
    ],
    ...
  },
  "questions": {
    "1": {
      "A": { "x": 491, "y": 784 },
      "B": { "x": 536, "y": 784 },
      ...
    },
    ...
  }
}
```

## 2. Fetching Sheet Overlay Data

For each student's sheet, fetch the overlay data which contains **values** (what the student marked), not coordinates.

**Endpoint:** `GET /sheets/{sheet_id}/overlay`

**Response Structure:**
```json
{
  "top": {
    "dimensions": { "w": 1440, "h": 595 },
    "values": {
      "class_level": 1,
      "student_roll": "12345",
      ...
    },
    "scores": { "subject1": 45, ... }
  },
  "bottom": {
    "dimensions": { "w": 1170, "h": 1650 },
    "answers": [
      { "q": 1, "val": 4 }, // val 4 means 'C' (1=A, 2=B, 4=C, 8=D)
      { "q": 2, "val": 1 }, // val 1 means 'A'
      ...
    ]
  }
}
```

## 3. Fetching the Answer Key

To visualize correct/incorrect answers, you need the Answer Key for the task.

**Endpoint:** `GET /sheets/answer-key/{task_id}`

**Response Structure:**
```json
{
  "1": 4,  // Question 1 correct answer is C (4)
  "2": 1,  // Question 2 correct answer is A (1)
  ...
  "150": 2 // Question 150 correct answer is B (2)
}
```

## 4. Coordinate Transformation Logic

The images you display are **crops** of the original sheet. The static layout provides **absolute coordinates** (based on the full original sheet). You must transform these to **relative coordinates** for the cropped image.

### Algorithm

Given:
- `absX`, `absY`: Bubble coordinates from Static Layout
- `crop_x`, `crop_y`, `crop_w`: Crop configuration from Static Layout (`config.top` or `config.bottom`)
- `displayW`: The actual width (pixels) of the image rendered on the user's screen (e.g., 920px for header, 350px for answers)

```typescript
function transformToOverlay(absX, absY, cropX, cropY, cropW, displayW) {
    // 1. Shift origin to the crop
    const relX = absX - cropX;
    const relY = absY - cropY;

    // 2. Calculate Scale Factor
    const scale = displayW / cropW;

    // 3. Scale to display size
    return {
        x: relX * scale,
        y: relY * scale
    };
}
```

## 5. Implementation Steps (React Example)

1.  **Load Static Layout:** fetch `GET /sheets/layout` on app start or page load.
2.  **Load Sheet Data:** fetch `GET /sheets/{id}/overlay`.
3.  **Load Answer Key:** fetch `GET /sheets/answer-key/{task_id}`.
4.  **Render Image:** Display the sheet image (`GET /sheets/{id}/image?part=...`).
5.  **Render Overlays:**
    - Iterate through student answers (overlay data).
    - Find corresponding coordinates in Static Layout.
    - Transform coordinates.
    - Draw circle/cross overlay.
    - Compare student value with Answer Key value to determine color (Green=Correct, Red=Wrong).

### Helper Checks

- **Check Option A:** `(val & 1) === 1`
- **Check Option B:** `(val & 2) === 2`
- **Check Option C:** `(val & 4) === 4`
- **Check Option D:** `(val & 8) === 8`
- **Check Option E:** `(val & 16) === 16`
