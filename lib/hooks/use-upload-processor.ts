import { useEffect, useRef } from 'react';
import { useUploadQueueStore } from '../stores/upload-queue-store';
import { uploadFile } from '../chunked-upload';

export function useUploadQueueProcessor() {
    const {
        queue,
        isProcessing,
        setProcessing,
        updateItemStatus,
        updateItemProgress
    } = useUploadQueueStore();

    // Use a ref for mounted state to access it inside async closures correctly
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Keep a ref to prevent double-firing
    const processingRef = useRef(false);

    // Monitor queue and processing state
    useEffect(() => {
        const checkAndProcessQueue = async () => {
            // 1. Check if we are already processing
            if (processingRef.current) return;

            // 2. Find the next pending item
            const nextItem = queue.find((item) => item.status === 'pending');

            if (!nextItem) {
                // Only set processing to false if it was true (optimization)
                if (isProcessing) {
                    setProcessing(false);
                }
                return;
            }

            // 3. Mark as processing
            processingRef.current = true;
            setProcessing(true);

            const abortController = new AbortController();

            try {
                // Update status to 'uploading'
                updateItemStatus(nextItem.id, 'uploading');
                console.log(`[Queue] Starting file: ${nextItem.file.name}`);

                const result = await uploadFile(
                    nextItem.file,
                    nextItem.uploadType,
                    nextItem.taskId,
                    nextItem.notes,
                    nextItem.profileId,
                    (progress) => {
                        if (mountedRef.current) {
                            updateItemProgress(nextItem.id, progress.percentage, progress.bytesUploaded);
                        }
                    },
                    nextItem.alignmentMode,
                    abortController.signal
                );

                console.log(`[Queue] Completed upload: ${nextItem.file.name} - Batch: ${result.batch_id}`);

                // Update status to 'processing' and start polling
                if (mountedRef.current) {
                    updateItemStatus(nextItem.id, 'processing', undefined, result.batch_id);
                }

                // Poll for completion
                // We keep the lock held effectively by awaiting this loop
                // This ensures the next item doesn't start until this one is done
                let isComplete = false;
                const POLLING_INTERVAL = 2000; // 2 seconds

                while (!isComplete && mountedRef.current) {
                    try {
                        // Dynamically import to avoid circular dependencies if any, 
                        // though here we can likely import at top level. 
                        // For safety in this hook context:
                        const { batchesAPI } = await import('../api/batches');
                        const status = await batchesAPI.getStatus(result.batch_id, false);

                        // Check for terminal states
                        if (status.status === 'completed' || status.status === 'failed') {
                            isComplete = true;
                            if (mountedRef.current) {
                                // We mark it as completed in queue even if it failed processing
                                // so the queue can move on. The UI will show red/green based on batch status.
                                updateItemStatus(nextItem.id, 'completed', undefined, result.batch_id);
                            }
                        } else {
                            // Still processing/validating
                            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
                        }
                    } catch (pollError) {
                        console.error(`[Queue] Polling error for ${result.batch_id}:`, pollError);
                        // If polling fails repeatedly, we might want to break, but one error shouldn't stop it if possible.
                        // For now, let's just wait and retry.
                        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
                    }
                }

            } catch (error: any) {
                console.error(`[Queue] Error uploading ${nextItem.file.name}:`, error);

                if (mountedRef.current) {
                    const isAborted = error.message === 'Upload cancelled by user' || error.name === 'AbortError';
                    updateItemStatus(nextItem.id, isAborted ? 'aborted' : 'error', error.message);
                }
            } finally {
                // 5. Release lock
                processingRef.current = false;

                // 6. Trigger next cycle
                if (mountedRef.current) {
                    // We toggle isProcessing to force re-evaluation of effect
                    setProcessing(false);
                    // Small delay to let state settle before next tick might pick up
                }
            }
        };

        checkAndProcessQueue();

    }, [queue, isProcessing, setProcessing, updateItemStatus, updateItemProgress]);
}
