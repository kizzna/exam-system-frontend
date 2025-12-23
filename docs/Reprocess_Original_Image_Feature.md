# Reprocess Original Image Feature

This feature allows re-running the full OMR processing pipeline on an existing sheet using its original uploaded image. This is useful when the initial processing failed or produced sub-optimal results (e.g., due to poor alignment), and you want to retry with different parameters.

## API Endpoint

`POST /api/sheets/{sheet_id}/reprocess-image`

## Payload

The endpoint accepts a JSON payload with the following optional parameters:

```json
{
  "task_id": "string (optional) - 8-digit task ID override",
  "profile_id": "integer (optional) - OMR Profile ID to use",
  "alignment_mode": "string (optional) - 'standard', 'imreg_dft', or 'hybrid'",
  "config_overrides": {
    // optional dictionary of config keys to override
    "threshold_value": 150
  }
}
```

## Response

Success (200 OK):

```json
{
  "status": "success",
  "message": "Sheet reprocessed successfully",
  "quality_score": 98.5,
  "confidence_score": 95.2
}
```

## UI in Frontend and Usecases

We will re-use same reprocess button to activate this feature.
Current modal is small to include new feathres.
Modal should be enlarged to to similar size of direct image upload modal.
Previous reprocess flow will be kept as case 1 and is default mode for reprocessing.
New reprocess flow will be case 2.
- Case 1: used when sheet is required to re-process with different profile without alignment (current reprocess flow).
- Case 2: used when sheet is not processed properly and aligned image was never created.
This case requires full reprocessing of the image.
Two flows are displayed separately by different radio button.
Radio button 1, label: "อ่านคำตอบใหม่": reprocess with different profile without alignment (current reprocess flow).
Radio button 2, label: "อ่านจากต้นฉบับใหม่": reprocess with full reprocessing of the image.
This option will show similar to upload direct image modal which has profile selection and alignment mode selection.
For this options, "ปกติ" Profile as default profile and "standard" as default alignment mode.


### Example Function

```javascript
async function reprocessSheet(sheetId, alignmentMode = 'standard') {
  try {
    const response = await fetch(`/api/sheets/${sheetId}/reprocess-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Assuming auth
      },
      body: JSON.stringify({
        alignment_mode: alignmentMode,
        profile_id: profileId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Reprocessing failed');
    }

    const result = await response.json();
    console.log('Reprocess success:', result);
    
    // Refresh sheet data to show new results
    await loadSheetData(sheetId);
    
  } catch (err) {
    console.error('Error reprocessing sheet:', err);
    alert('Failed to reprocess sheet');
  }
}
```

## Notes

- **Destructive Update:** This action replaces the existing answers and processing stats (quality, confidence) for the sheet.
- **Preserved Fields:** `class_group`, `class_level`, `exam_center_code`, and `qr_code` are preserved.