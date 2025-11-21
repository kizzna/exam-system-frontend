# SSE Integration - Ready for Frontend Testing

**Date:** November 20, 2025  
**Status:** ✅ Backend integration complete  
**Deployment:** Both API servers updated and restarted

---

## Summary

The backend has fully integrated Server-Sent Events (SSE) progress publishing throughout the batch processing pipeline. The frontend can now receive real-time progress updates during batch uploads and processing.

---

## What Changed

### Problem (From Frontend Report)
- SSE endpoint was working
- Frontend could connect successfully
- **But NO progress events were being published during batch processing**

### Solution
Integrated `ProgressPublisher.publish_progress()` calls throughout the entire batch processing pipeline in `src/api/routers/jobs.py`:

1. ✅ Extraction stage (start + complete)
2. ✅ Worker dispatching
3. ✅ Worker processing (periodic updates every 10 seconds)
4. ✅ Worker completion
5. ✅ Result collection
6. ✅ CSV generation
7. ✅ Database loading
8. ✅ Batch cleanup
9. ✅ Final completion event
10. ✅ Failure event (on errors)

---

## API Endpoint

```
GET /api/batches/{batch_id}/stream
```

**Headers:**
```
Accept: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Response:**
```
Content-Type: text/event-stream
```

---

## Event Format

Each SSE event contains JSON data with this structure:

```json
{
  "stage": "processing_sheets",
  "message": "Processing: 150/291 sheets completed",
  "progress_percentage": 51.5,
  "sheets_total": 291,
  "sheets_processed": 150,
  "elapsed_seconds": 45,
  "timestamp": "2025-11-20T12:56:30Z"
}
```

**Fields:**
- `stage` (string): Current processing stage (see stages below)
- `message` (string): Human-readable progress message
- `progress_percentage` (float): 0-100 percentage for current stage
- `sheets_total` (int, optional): Total number of sheets in batch
- `sheets_processed` (int, optional): Number of sheets processed so far
- `elapsed_seconds` (int, optional): Time elapsed since stage started
- `timestamp` (string): ISO 8601 timestamp

---

## Processing Stages (in order)

| Stage                | Description                      | Progress Updates |
| -------------------- | -------------------------------- | ---------------- |
| `uploading`          | Chunked upload in progress       | Per chunk        |
| `extracting`         | Extracting ZIP file              | Start + Complete |
| `organizing_qr`      | Organizing sheets by QR code     | (Covered by extraction) |
| `processing_sheets`  | Workers processing OMR sheets    | Every 10 seconds |
| `collecting_results` | Collecting results from workers  | Start + Complete |
| `generating_csv`     | Generating CSV files             | Start + Complete |
| `loading_database`   | Loading data to MySQL            | Start + Complete |
| `cleanup`            | Cleaning up temporary files      | Start only       |
| `completed`          | Batch completed successfully     | Final event      |
| `failed`             | Batch processing failed          | Error event      |

---

## Example Event Sequence

```javascript
// 1. Extraction starts
data: {"stage":"extracting","message":"Starting extraction","progress_percentage":0}

// 2. Extraction completes
data: {"stage":"extracting","message":"Extraction complete - 291 sheets","progress_percentage":100,"sheets_total":291}

// 3. Workers dispatched
data: {"stage":"processing_sheets","message":"Dispatching 291 tasks to workers","progress_percentage":0,"sheets_total":291}

// 4. Worker progress (every 10 seconds)
data: {"stage":"processing_sheets","message":"Processing: 50/291 sheets completed","progress_percentage":17.2,"sheets_total":291,"sheets_processed":50,"elapsed_seconds":15}

data: {"stage":"processing_sheets","message":"Processing: 100/291 sheets completed","progress_percentage":34.4,"sheets_total":291,"sheets_processed":100,"elapsed_seconds":25}

data: {"stage":"processing_sheets","message":"Processing: 150/291 sheets completed","progress_percentage":51.5,"sheets_total":291,"sheets_processed":150,"elapsed_seconds":35}

// 5. All workers complete
data: {"stage":"processing_sheets","message":"All 291 tasks completed (0 failed)","progress_percentage":100,"sheets_total":291,"sheets_processed":291,"elapsed_seconds":82}

// 6. Collecting results
data: {"stage":"collecting_results","message":"Collected 291 results","progress_percentage":100,"sheets_total":291,"sheets_processed":291}

// 7. CSV generation
data: {"stage":"generating_csv","message":"CSV generation complete: 291 sheets, 11640 answers","progress_percentage":100,"sheets_total":291,"sheets_processed":291}

// 8. Database loading
data: {"stage":"loading_database","message":"Database load complete: 291 sheets, 11640 answers in 1234ms","progress_percentage":100,"sheets_total":291,"sheets_processed":291}

// 9. Cleanup
data: {"stage":"cleanup","message":"Cleaning up batch files","progress_percentage":0,"sheets_total":291,"sheets_processed":291}

// 10. Completion
data: {"stage":"completed","message":"Batch completed successfully","progress_percentage":100,"sheets_total":291,"sheets_processed":291}
```

---

## Frontend Implementation Example

### JavaScript (EventSource API)

```javascript
const batchId = '550e8400-e29b-41d4-a716-446655440000';
const eventSource = new EventSource(
  `http://gt-omr-api-1:8000/api/batches/${batchId}/stream`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  console.log(`[${data.stage}] ${data.message}`);
  
  // Update UI
  updateProgressBar(data.progress_percentage);
  updateStageLabel(data.stage);
  updateStatusMessage(data.message);
  
  if (data.sheets_processed && data.sheets_total) {
    updateSheetCount(data.sheets_processed, data.sheets_total);
  }
  
  // Close connection on completion/failure
  if (data.stage === 'completed' || data.stage === 'failed') {
    eventSource.close();
    onBatchComplete(data);
  }
};

eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  eventSource.close();
};
```

### React Hook Example

```jsx
import { useEffect, useState } from 'react';

function useBatchProgress(batchId) {
  const [progress, setProgress] = useState({
    stage: 'uploading',
    message: 'Starting...',
    progress_percentage: 0,
    sheets_total: 0,
    sheets_processed: 0
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(
      `${API_URL}/api/batches/${batchId}/stream`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data);

      if (data.stage === 'completed' || data.stage === 'failed') {
        setIsComplete(true);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [batchId]);

  return { progress, isComplete };
}

// Usage in component
function BatchProgress({ batchId }) {
  const { progress, isComplete } = useBatchProgress(batchId);

  return (
    <div>
      <h3>{progress.stage}</h3>
      <p>{progress.message}</p>
      <ProgressBar value={progress.progress_percentage} />
      {progress.sheets_total > 0 && (
        <p>Sheets: {progress.sheets_processed} / {progress.sheets_total}</p>
      )}
      {isComplete && <p>✓ Complete!</p>}
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Connect to SSE endpoint with valid batch_id
- [ ] Verify connection stays open during processing
- [ ] Confirm events are received for each stage
- [ ] Check progress_percentage increases from 0 to 100
- [ ] Verify sheets_processed count updates
- [ ] Confirm connection closes on `completed` event
- [ ] Test error handling (connection drop, invalid batch_id)
- [ ] Verify no events are missed (check event sequence)
- [ ] Test with large batch (>100 sheets) for periodic updates
- [ ] Check reconnection behavior if connection drops

---

## Debugging

### Check API Logs

```bash
ssh gt-omr-api-1 'journalctl -u omr-api.service -f'
```

Look for:
```
INFO - Publishing progress: batch=abc-123, stage=processing_sheets, message=Processing: 50/291 sheets completed
```

### Check Redis

```bash
# Current progress
redis-cli GET "batch:{batch_id}:progress:current"

# Event log (all events)
redis-cli LRANGE "batch:{batch_id}:progress:log" 0 -1

# Monitor pubsub in real-time
redis-cli PSUBSCRIBE "batch:*:progress"
```

### Verify SSE with cURL

```bash
curl -N http://gt-omr-api-1:8000/api/batches/{batch_id}/stream
```

You should see:
```
data: {"stage":"extracting","message":"Starting extraction",...}

data: {"stage":"extracting","message":"Extraction complete - 291 sheets",...}

data: {"stage":"processing_sheets","message":"Dispatching 291 tasks",...}
```

---

## Known Limitations

1. **No reconnection handling** - If SSE connection drops, client must reconnect manually
2. **No event replay** - Reconnecting clients won't receive missed events (but can fetch current progress from Redis)
3. **Redis TTL** - Progress events are kept in Redis for 24 hours, then auto-expire
4. **No compression** - SSE events are sent as plain text (gzip available via Accept-Encoding)

---

## Next Steps

1. **Frontend Team:**
   - Implement SSE connection in upload flow
   - Test with real batches
   - Report any issues or missing information

2. **Backend Team:**
   - Monitor production for SSE performance
   - Add more granular events if needed
   - Consider implementing event replay for reconnections

---

## Support

**Questions or Issues:**
- Backend: SSE integration is complete and deployed
- Frontend: Please test and report any issues
- Logs: Check API server logs and Redis for debugging

**Status:** ✅ Ready for frontend integration and testing
