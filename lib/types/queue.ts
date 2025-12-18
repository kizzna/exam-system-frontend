import type { UploadType } from './batches';

export type QueueItemStatus = 'pending' | 'uploading' | 'completed' | 'error' | 'aborted';

export interface QueueItem {
    id: string; // Unique ID for the queue item
    file: File;
    status: QueueItemStatus;
    progress: number; // 0 to 100
    bytesUploaded: number;
    totalBytes: number;

    // Metadata required for your uploadFile function
    uploadType: UploadType;
    taskId: string | null;
    notes: string | null;
    profileId: number | null;

    // Result from server
    batchId?: string;
    errorMessage?: string;
    abortController?: AbortController;
}
