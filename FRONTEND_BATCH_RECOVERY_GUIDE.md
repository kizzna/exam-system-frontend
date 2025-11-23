# Frontend Batch Recovery Implementation Guide

## Overview
This document outlines how the frontend should handle batch upload failures and implement the manual recovery mechanism.

## Problem Context
Batch uploads can occasionally fail due to:
1.  **Timeouts**: Large batches exceeding the processing time limit.
2.  **Orchestrator Crashes**: The backend service restarting during processing.
3.  **Network Issues**: Connection loss between workers and the database.

When this happens, the batch might be stuck in a `processing` state or marked as `failed` even though some results are available in the Redis buffer.

## Backend Recovery Mechanism
We have implemented a recovery endpoint on the backend:
`POST /api/batches/{batch_id}/recover`

This endpoint:
1.  Checks for any pending results in Redis for the given batch.
2.  Writes them to the MySQL database.
3.  Updates the batch status to `completed` if data was recovered.
4.  Returns the number of sheets and answers recovered.

## Frontend Implementation Strategy

### 1. Detecting Failed/Stuck Batches
The frontend should identify batches that need recovery when:
*   **Status is `failed`**: The batch explicitly failed (e.g., due to timeout).
*   **Status is `processing` for too long**: If a batch has been processing for > 2 hours (configurable) without updates.

### 2. User Interface Updates

#### Batch List / Status Page
*   **Add a "Recover" Button**: For batches in `failed` state, show a "Recover Results" button.
*   **Tooltip**: "Attempt to recover processed results from temporary storage."

#### Implementation Example (React/TypeScript)

```typescript
// API Service
const recoverBatch = async (batchId: string) => {
  try {
    const response = await api.post(\`/batches/\${batchId}/recover\`);
    return response.data;
  } catch (error) {
    console.error("Recovery failed", error);
    throw error;
  }
};

// Component Logic
const handleRecover = async (batchId: string) => {
  setRecovering(true);
  try {
    const result = await recoverBatch(batchId);
    
    if (result.success) {
      toast.success(\`Recovery successful! Saved \${result.sheets_recovered} sheets.\`);
      // Refresh batch list to show updated status
      refreshBatches();
    } else {
      toast.error("Recovery attempted but no data found.");
    }
  } catch (error) {
    toast.error("Failed to trigger recovery.");
  } finally {
    setRecovering(false);
  }
};
```

### 3. Automatic Recovery (Optional)
For a more seamless experience, the frontend *could* attempt to auto-recover when it detects a timeout failure, but manual user initiation is safer and provides better feedback.

## API Reference

### Recover Batch
**URL**: `/api/batches/{batch_id}/recover`
**Method**: `POST`
**Auth**: Required (Admin or Batch Owner)

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Recovery successful. Recovered 50 sheets and 1500 answers.",
  "sheets_recovered": 50,
  "answers_recovered": 1500
}
```

**Error Response (500 Internal Server Error)**:
```json
{
  "detail": "Recovery failed: Redis connection error"
}
```
