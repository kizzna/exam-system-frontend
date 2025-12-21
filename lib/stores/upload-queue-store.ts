import { create } from 'zustand';
import type { QueueItem, QueueItemStatus } from '../types/queue';
import type { UploadType } from '../types/batches';

interface UploadQueueState {
    queue: QueueItem[];
    isProcessing: boolean;

    // Actions
    addFiles: (files: File[], metadata: {
        uploadType: UploadType,
        taskId: string | null,
        notes?: string,
        profileId?: number | null,
        alignmentMode?: 'hybrid' | 'standard' | 'imreg_dft'
    }) => void;
    removeItem: (id: string) => void;
    updateItemStatus: (id: string, status: QueueItemStatus, error?: string, batchId?: string) => void;
    updateItemProgress: (id: string, progress: number, bytesUploaded: number) => void;
    setProcessing: (isProcessing: boolean) => void;
    clearCompleted: () => void;
    resetQueue: () => void;
}

export const useUploadQueueStore = create<UploadQueueState>((set) => ({
    queue: [],
    isProcessing: false,

    addFiles: (files, metadata) => set((state) => {
        const newItems: QueueItem[] = files.map((file) => ({
            id: Math.random().toString(36).substring(2) + Date.now().toString(36),
            file,
            status: 'pending',
            progress: 0,
            bytesUploaded: 0,
            totalBytes: file.size,
            uploadType: metadata.uploadType,
            taskId: metadata.taskId,
            notes: metadata.notes || null,
            profileId: metadata.profileId || null,
            alignmentMode: metadata.alignmentMode,
        }));
        return { queue: [...state.queue, ...newItems] };
    }),

    removeItem: (id) => set((state) => ({
        queue: state.queue.filter((item) => item.id !== id)
    })),

    updateItemStatus: (id, status, error, batchId) => set((state) => ({
        queue: state.queue.map((item) =>
            item.id === id ? { ...item, status, errorMessage: error, batchId } : item
        )
    })),

    updateItemProgress: (id, progress, bytesUploaded) => set((state) => ({
        queue: state.queue.map((item) =>
            item.id === id ? { ...item, progress, bytesUploaded } : item
        )
    })),

    setProcessing: (isProcessing) => set({ isProcessing }),

    clearCompleted: () => set((state) => ({
        queue: state.queue.filter(item => item.status !== 'completed')
    })),

    resetQueue: () => set({ queue: [], isProcessing: false }),
}));
