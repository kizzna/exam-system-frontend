# Add pipline selection to batch upload

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

- We have profile selection dropdown before dropzone
- Alignment mode selection dropdown will be right side of profile selection dropdown.
Hybrid is selected by default and this option is only visible for admin user.

### UI Elements

Add a dropdown for **Alignment Strategy**:

*   **Label:** วิธีปรับภาพให้ตรง (ห้ามเปลี่ยนแปลง)
*   **Options:**
    *   `hybrid`: **Auto / Hybrid (Default)** - Tries standard first, falls back to robust method if needed.
    *   `standard`: **Standard Only** - Strict anchor checks. Best for high-quality scans.
    *   `imreg_dft`: **Force Robust (Slow)** - Uses DFT alignment. Use for batches known to be rotated/distorted.

### Integration Example (JavaScript/React)

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