# Frontend OMR Overlay Implementation Guide

This guide explains how to implement the OMR sheet overlay using the new static coordinates API (`GET /sheets/layout`) and the slimmed-down overlay data API (`GET /sheets/{id}/overlay`).

## Overview

The OMR overlay system has been optimized to reduce API payload size. Instead of receiving coordinates for every single bubble in every response, you now fetch the **Master Layout** once and apply it to individual sheets.

### Key Concepts

1.  **Master Layout (`GET /sheets/layout`)**: Contains the absolute coordinates (`x`, `y`) of all bubbles on the *original full-size OMR sheet*. It also includes the **Crop Configuration** (`config`) which tells you how the backend crops the images for the 'top' and 'bottom' parts.
2.  **Sheet Overlay Data (`GET /sheets/{id}/overlay`)**: Contains the specific values for a student's sheet (e.g., "Student Roll: 12345", "Question 1: A"). It does *not* contain coordinates.
3.  **Sheet Images (`GET /sheets/{id}/image?part=...`)**: Returns the cropped image for the 'top' or 'bottom' part. You can optionally request a resized image using `width=...`.

## 1. Fetching the Layout

Call `GET /sheets/layout` once (e.g., on page load) and cache it.

**Response Structure:**
```json
{
  "config": {
    "top": {
      "crop_x": 105, "crop_y": 105, "crop_w": 1440, "crop_h": 595
    },
    "bottom": {
      "crop_x": 385, "crop_y": 635, "crop_w": 1170, "crop_h": 1650
    }
  },
  "header_layout": {
    "id_class_level": [ { "val": "1", "x": 992, "y": 220 }, ... ],
    ...
  },
  "questions": {
    "1": { "A": { "x": 491, "y": 784 }, ... },
    ...
  }
}
```

## 2. Calculating Coordinates

The coordinates in `header_layout` and `questions` are **Absolute** (relative to the original full sheet). The images you display are **Cropped** and potentially **Resized**. You must transform the coordinates to match the displayed image.

### Formula

For a given bubble with absolute coordinates $(x_{abs}, y_{abs})$:

1.  **Identify the Part**:
    *   `header_layout` bubbles belong to the **top** part.
    *   `questions` bubbles belong to the **bottom** part.

2.  **Get Crop Offsets**:
    *   Use `config[part].crop_x` and `config[part].crop_y`.

3.  **Calculate Relative Coordinates (Unscaled)**:
    $$x_{rel} = x_{abs} - crop\_x$$
    $$y_{rel} = y_{abs} - crop\_y$$

4.  **Apply Scaling (If Image is Resized)**:
    *   If you requested the image with `width={target_width}`:
        $$scale\_factor = \frac{target\_width}{crop\_w}$$
    *   If you are displaying the image at a specific width in CSS (responsive), calculate the scale factor based on the rendered width vs. the natural width of the cropped image (`crop_w`).
    
    $$x_{final} = x_{rel} \times scale\_factor$$
    $$y_{final} = y_{rel} \times scale\_factor$$

### Example

*   **Bubble**: Question 1, Option A ($x_{abs}=491, y_{abs}=784$)
*   **Part**: Bottom
*   **Config**: `crop_x=385, crop_y=635`
*   **Image Request**: `width=350`
*   **Original Crop Width**: `crop_w=1170`

**Calculation:**
1.  $x_{rel} = 491 - 385 = 106$
2.  $y_{rel} = 784 - 635 = 149$
3.  $scale\_factor = 350 / 1170 \approx 0.299$
4.  $x_{final} = 106 \times 0.299 \approx 31.7$
5.  $y_{final} = 149 \times 0.299 \approx 44.6$

Draw the overlay circle at $(31.7, 44.6)$ on top of the 350px wide image.

## 3. Rendering the Overlay

1.  **Header Section (Top Image)**:
    *   Iterate through `header_layout`.
    *   For each field (e.g., `id_class_level`), check the value in the `overlay_data.top.values`.
    *   Find the bubble in `header_layout` that matches this value.
    *   Calculate its position and draw a marker (e.g., a filled circle or checkmark).
    *   *Note*: For multi-column fields like `student_roll`, the value is a string (e.g., "20023"). You need to map each digit to the corresponding column (e.g., `id_student_roll_col_1` gets '2', `col_2` gets '0', etc.).

2.  **Questions Section (Bottom Image)**:
    *   Iterate through `overlay_data.bottom.answers`.
    *   For each answer, you get `q` (question number) and `val` (student's answer).
    *   Look up the coordinates for Question `q` in `layout.questions`.
    *   **Student Answer**: If `val` is present (e.g., 1=A, 2=B, 4=C, 8=D), find the corresponding bubble (A, B, C, or D) and draw the "Student Mark".
    *   **Correct Answer**: If you need to show the correct answer (e.g., from Answer Key API), look up the correct option and draw the "Correct Mark" (usually green).

## 4. Handling Missing/Null Values

*   If `val` is null in the overlay data, it means the student didn't mark anything or it wasn't detected. Do not draw a mark.
*   If `val` is a bitmask (e.g., 3 = A+B), you may need to handle multiple bubbles if your UI supports it, or just show it as "Invalid".
