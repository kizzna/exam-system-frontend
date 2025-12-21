# Frontend Integration Guide: OMR Alignment Configuration

## Overview
We have introduced a new configurable alignment strategy for the OMR processing pipeline to handle heavily rotated or distorted images. This feature is exposed via the Batch Upload API.

**Default Behavior:**
- **Hybrid (Recommended):** Tries "Standard" alignment first. If it fails (due to rotation/distortion), it automatically falls back to "Robust (imreg_dft)" alignment.

**New Options:**
- **Standard:** Use strict anchor-based alignment only. Fast but sensitive to rotation.
- **Robust (imreg_dft):** Use DFT-based image registration. Slower but handles large rotations.
- **Hybrid:** Best of both worlds (Default).

## API Changes

### Endpoint: `POST /api/jobs/submit`

A new form field `alignment_mode` has been added.

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `alignment_mode` | string | No | `hybrid` | Strategy to use. Values: `standard`, `imreg_dft`, `hybrid` |

## Frontend UI Implementation Guide

We recommend adding an "Advanced Options" toggle or section in the Batch Upload form.

### 1. UI Elements

Add a dropdown or radio group for **Alignment Strategy**:

*   **Label:** Alignment Strategy
*   **Options:**
    *   `hybrid`: **Auto / Hybrid (Recommended)** - Tries standard first, falls back to robust method if needed.
    *   `standard`: **Standard Only** - Strict anchor checks. Best for high-quality scans.
    *   `imreg_dft`: **Force Robust (Slow)** - Uses DFT alignment. Use for batches known to be rotated/distorted.

### 2. Integration Example (JavaScript/React)

When constructing the `FormData` for the upload request:

```javascript
/* 
  Example React/JS implementation snippet 
*/
const handleUpload = async (files, settings) => {
  const formData = new FormData();
  
  // Existing fields
  files.forEach(file => formData.append('files', file));
  formData.append('user_id', currentUser.id);
  formData.append('has_qr', settings.hasQr);
  
  // NEW: Alignment Mode
  // Only append if user selected a non-default option
  if (settings.alignmentMode && settings.alignmentMode !== 'hybrid') {
      formData.append('alignment_mode', settings.alignmentMode);
  }
  
  // ... send request ...
  const response = await fetch('/api/jobs/submit', {
      method: 'POST',
      body: formData
  });
};
```

### 3. User Testing Steps

 To verify the integration:
 1. Go to the Batch Upload page.
 2. Open "Advanced Options" (implement if needed).
 3. Select **Force Robust (Slow)** or `imreg_dft`.
 4. Upload the test image (e.g., the rotated `569-6189.jpg`).
 5. Monitor the server logs. You should see:
    `Starting Alignment | Mode: imreg_dft`
 6. Result should be successful.

## Notes
- The "Standard" mode is the fastest.
- The "Robust" mode adds approximately 1.5-3 seconds per image processing time but guarantees alignment for rotated sheets.
