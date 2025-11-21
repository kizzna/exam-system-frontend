#!/bin/bash
#
# SSE Progress Streaming Test
# Tests that progress events are published during batch processing
#

set -e

API_URL="http://gt-omr-api-1:8000"
REDIS_HOST="gt-omr-redis-1"

echo "=== SSE Progress Streaming Test ==="
echo ""

# Check if we have a test ZIP file
if [ ! -f "tests/test_data/sample_batch.zip" ]; then
    echo "❌ Test file not found: tests/test_data/sample_batch.zip"
    echo "Please create a small test ZIP file for testing"
    exit 1
fi

echo "1. Submitting test batch..."
RESPONSE=$(curl -s -X POST "$API_URL/api/batches/upload" \
    -F "file=@tests/test_data/sample_batch.zip" \
    -F "user_id=test-user" \
    -F "has_qr=true")

BATCH_ID=$(echo "$RESPONSE" | jq -r '.batch_id')

if [ -z "$BATCH_ID" ] || [ "$BATCH_ID" = "null" ]; then
    echo "❌ Failed to submit batch"
    echo "$RESPONSE" | jq '.'
    exit 1
fi

echo "✓ Batch submitted: $BATCH_ID"
echo ""

echo "2. Monitoring SSE stream for 30 seconds..."
echo ""

# Subscribe to SSE endpoint and collect events
timeout 30 curl -s -N "$API_URL/api/batches/$BATCH_ID/stream" | while IFS= read -r line; do
    if [[ "$line" == data:* ]]; then
        EVENT_DATA="${line#data: }"
        
        # Parse the JSON event
        STAGE=$(echo "$EVENT_DATA" | jq -r '.stage // "unknown"')
        MESSAGE=$(echo "$EVENT_DATA" | jq -r '.message // "no message"')
        PROGRESS=$(echo "$EVENT_DATA" | jq -r '.progress_percentage // 0')
        
        echo "[SSE Event] Stage: $STAGE | Progress: ${PROGRESS}% | Message: $MESSAGE"
    fi
done || true

echo ""
echo "3. Checking Redis for published events..."

# Check if events were published to Redis
REDIS_EVENTS=$(ssh gt-omr-redis-1 "redis-cli LRANGE batch:$BATCH_ID:progress:log 0 -1" 2>/dev/null || echo "")

if [ -n "$REDIS_EVENTS" ]; then
    EVENT_COUNT=$(echo "$REDIS_EVENTS" | wc -l)
    echo "✓ Found $EVENT_COUNT events in Redis"
    echo ""
    echo "Sample events:"
    echo "$REDIS_EVENTS" | head -5 | while IFS= read -r event; do
        echo "  - $(echo "$event" | jq -r '.stage + ": " + .message' 2>/dev/null || echo "$event")"
    done
else
    echo "⚠️  No events found in Redis for batch $BATCH_ID"
fi

echo ""
echo "4. Final batch status:"
BATCH_STATUS=$(curl -s "$API_URL/api/batches/$BATCH_ID/status" | jq -r '.status')
echo "Status: $BATCH_STATUS"

echo ""
echo "=== Test Complete ==="
