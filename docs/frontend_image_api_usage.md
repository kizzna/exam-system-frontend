# Frontend API Usage: Sheet Image Retrieval

The `/sheets/<id>/image` endpoint has been updated to support retrieving full-size aligned and original images, in addition to the existing cropped views.

## Endpoint

`GET /api/sheets/<sheet_id>/image`

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `part`    | string | Yes      | The part of the image to retrieve. Options: `top`, `bottom`, `aligned`, `original`. |
| `width`   | integer | No      | Target width in pixels for resizing. **Only applies to `top` and `bottom` parts.** Ignored for `aligned` and `original` to preserve full quality. |

## Options

### 1. Header Crop (`top`)
Retrieves the cropped header section (Student ID, Class, etc.).
*   **Format:** WebP
*   **Resizing:** Supported via `width` parameter.

**Example:**
```
GET /api/sheets/1001/image?part=top&width=800
```

### 2. Answers Crop (`bottom`)
Retrieves the cropped answers section.
*   **Format:** WebP
*   **Resizing:** Supported via `width` parameter.

**Example:**
```
GET /api/sheets/1001/image?part=bottom
```

### 3. Aligned Image (`aligned`)
Retrieves the full-size, aligned image used for processing (OMR scanning). This image has been corrected for rotation and perspective.
*   **Format:** Original (usually JPEG/PNG) or WebP depending on storage.
*   **Resizing:** NOT supported (returns full size).

**Example:**
```
GET /api/sheets/1001/image?part=aligned
```

### 4. Original Image (`original`)
Retrieves the raw, original image extracted from the uploaded ZIP archive. This is the exact file as it was uploaded, before any processing or alignment.
*   **Format:** Original format (e.g., JPEG, PNG) as kept in the ZIP archive.
*   **Resizing:** NOT supported (returns full size).
*   **Note:** This might be slower to retrieve as it involves extracting from the archive on the fly.

**Example:**
```
GET /api/sheets/1001/image?part=original
```

## Error Handling

*   `404 Not Found`: If the sheet, image file, or archive ZIP cannot be found.
*   `400 Bad Request`: If an invalid `part` is specified.
*   `500 Internal Server Error`: For other server-side issues (e.g., failed to extract zip).
