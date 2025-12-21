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

                console.log(`[Queue] Completed file: ${nextItem.file.name} - Batch: ${result.batch_id}`);

                if (mountedRef.current) {
                    updateItemStatus(nextItem.id, 'completed', undefined, result.batch_id);
                }

                // Cool down
                await new Promise(resolve => setTimeout(resolve, 5000));

            } catch (error: any) {
                console.error(`[Queue] Error uploading ${nextItem.file.name}:`, error);

                if (mountedRef.current) {
                    const isAborted = error.message === 'Upload cancelled by user' || error.name === 'AbortError';
                    updateItemStatus(nextItem.id, isAborted ? 'aborted' : 'error', error.message);
                }
            } finally {
                // 5. Release lock
                processingRef.current = false;

                // 6. Trigger next cycle by updating isProcessing state (dependency)
                // We typically want to set it false so the effect re-runs, sees !processingRef.current, and finds next item.
                if (mountedRef.current) {
                    setProcessing(false);
                }
            }
        };

        checkAndProcessQueue();

    }, [queue, isProcessing, setProcessing, updateItemStatus, updateItemProgress]);
}
