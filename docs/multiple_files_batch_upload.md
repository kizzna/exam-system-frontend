# Multiple Files Upload

## Overview
Current system does not support multiple files upload. Single large file upload has been working well
but it requires user to wait for the file to finish uploading before uploading the next file.
Large file also create very large database commit i.e. 7GB file with 11404 sheets will create 11404 sheets x 150 answers records = 1.7M records for one large commit and it takes 50-60 seconds for the commit operation. It never failed but it was tested with single user. It might fail if multiple users are uploading large files at the same time. To reduce the load on the database, we can implement a queue system that processes smaller batch at a time. i.e. instead of 7GB file with 11404 sheets, we can split it into smaller files with 1000-3000 sheets each. 

Please help me implement multiple files upload feature according to idea/solution provided below:

Desired functionalities:
1. user can add/drag-and-drop 1..MAX_UPLOAD_QUEUE into upload zone
2. current upload system already performing well just need to wrap it with new wrapper that can handle multiple files upload.
3. after each file uploaded, it'll check if current queue for processing omr sheet is busy or not. if not it'll start processing the file.
4. after each file finished it'll let the system cool down by showing progress bar for 5 seconds.
5. summary of each file uploaded will be shown in the table below upload zone.

# Ideas / Suggested Solution

To achieve the goal of allowing users to drop multiple files (e.g., ten 1GB files) and having the system manage them automatically, you need to wrap your existing `uploadFile` logic in a **Queue Manager**.

Since your current architecture is highly robust (parallel chunking saturates bandwidth), the best strategy is **Sequential File Processing**.

**Why Sequential Files + Parallel Chunks?**
If you try to upload 3 files at once, and each file tries to open 4 parallel chunk streams, you will hit 12 concurrent connections. Browsers typically cap this at 6 per domain. Requests will stall, timeout, or block, causing the "Network Error" you want to avoid.

Here is the implementation plan to replace the single-file logic with a Queue System using **Zustand** (since you are already using it).

### Step 1: Define Queue Types
Create a file `src/types/queue.ts`.

```typescript
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
  taskId: string;
  notes: string | null;
  profileId: number | null;
  
  // Result from server
  batchId?: string;
  errorMessage?: string;
  abortController?: AbortController;
}
```

### Step 2: Create the Queue Store
Create `src/stores/upload-queue-store.ts`. This handles the state of the UI.

```typescript
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid'; // You might need to install uuid or use a simple random string generator
import type { QueueItem, QueueItemStatus } from '../types/queue';
import type { UploadType } from '../types/batches';

interface UploadQueueState {
  queue: QueueItem[];
  isProcessing: boolean;
  
  // Actions
  addFiles: (files: File[], metadata: { uploadType: UploadType, taskId: string, notes?: string, profileId?: number }) => void;
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
      id: uuidv4(), // or Math.random().toString(36).substr(2, 9)
      file,
      status: 'pending',
      progress: 0,
      bytesUploaded: 0,
      totalBytes: file.size,
      uploadType: metadata.uploadType,
      taskId: metadata.taskId,
      notes: metadata.notes || null,
      profileId: metadata.profileId || null,
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
```

### Step 3: Create the Queue Processor Hook
Create `src/hooks/use-upload-processor.ts`. This is the "brain" that watches the queue and calls your existing `uploadFile` function.

```typescript
import { useEffect, useRef } from 'react';
import { useUploadQueueStore } from '../stores/upload-queue-store';
import { uploadFile } from '../utils/chunk-upload'; // Import your EXISTING upload utility

export function useUploadQueueProcessor() {
  const { 
    queue, 
    isProcessing, 
    setProcessing, 
    updateItemStatus, 
    updateItemProgress 
  } = useUploadQueueStore();

  // Keep a ref to prevent double-firing in strict mode or rapid re-renders
  const processingRef = useRef(false);

  useEffect(() => {
    const processQueue = async () => {
      // 1. Check if we are already running or if queue is empty
      if (processingRef.current || queue.length === 0) return;

      // 2. Find the next pending item
      const nextItem = queue.find((item) => item.status === 'pending');
      
      // 3. If no pending items left, stop.
      if (!nextItem) {
        setProcessing(false);
        return;
      }

      // 4. Start Processing
      processingRef.current = true;
      setProcessing(true);
      
      // Create an abort controller for this specific file
      const abortController = new AbortController();
      // Ideally, store this controller in the store so the user can click "Cancel" on the UI
      // updateItemController(nextItem.id, abortController); 

      updateItemStatus(nextItem.id, 'uploading');

      try {
        console.log(`[Queue] Starting file: ${nextItem.file.name}`);

        const result = await uploadFile(
          nextItem.file,
          nextItem.uploadType,
          nextItem.taskId,
          nextItem.notes,
          nextItem.profileId,
          (progress) => {
            // Map the callback to the store
            updateItemProgress(nextItem.id, progress.percentage, progress.bytesUploaded);
          },
          abortController.signal
        );

        console.log(`[Queue] Completed file: ${nextItem.file.name} - Batch: ${result.batch_id}`);
        updateItemStatus(nextItem.id, 'completed', undefined, result.batch_id);

      } catch (error: any) {
        console.error(`[Queue] Error uploading ${nextItem.file.name}:`, error);
        
        const isAborted = error.message === 'Upload cancelled by user' || error.name === 'AbortError';
        updateItemStatus(nextItem.id, isAborted ? 'aborted' : 'error', error.message);
      } finally {
        // 5. Release lock and trigger next pass
        processingRef.current = false;
        
        // This recursion happens via the useEffect dependency on `queue`.
        // When we update status to 'completed', the `queue` changes, 
        // triggering this effect again to pick up the next 'pending' item.
      }
    };

    processQueue();

  }, [queue, isProcessing]); // Re-run whenever queue state changes
}
```

### Step 4: Example Implementation in UI (React)

Here is how you would use this in your upload page.

```tsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadQueueStore } from './stores/upload-queue-store';
import { useUploadQueueProcessor } from './hooks/use-upload-processor';

export const BulkUploadComponent = () => {
  // 1. Initialize the processor hook
  useUploadQueueProcessor(); 
  
  const { addFiles, queue, removeItem } = useUploadQueueStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Add files to queue with shared metadata
    addFiles(acceptedFiles, {
      uploadType: 'zip_with_qr', // Example default
      taskId: '12345678', // This should probably come from a form input state
      notes: 'Bulk upload via queue'
    });
  }, [addFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="p-6">
      {/* Dropzone Area */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <p className="text-lg text-gray-600">
          Drag & drop multiple ZIP files here (e.g. 1GB each)
        </p>
        <p className="text-sm text-gray-400 mt-2">
          The system will queue and upload them automatically.
        </p>
      </div>

      {/* Queue List */}
      <div className="mt-8 space-y-4">
        {queue.map((item) => (
          <div key={item.id} className="bg-white border rounded p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium truncate max-w-md">{item.file.name}</span>
              <span className={`text-sm px-2 py-1 rounded capitalize
                ${item.status === 'completed' ? 'bg-green-100 text-green-800' : 
                  item.status === 'error' ? 'bg-red-100 text-red-800' :
                  item.status === 'uploading' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              >
                {item.status}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  item.status === 'error' ? 'bg-red-500' : 'bg-blue-600'
                }`}
                style={{ width: `${item.progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
              <span>{item.progress.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Why this is safer for your Architecture

1.  **Frontend Stability:** Your current chunking logic is aggressive (4 concurrent chunks). By queuing files sequentially, you maintain `4 connections total` at any time. If you ran files in parallel, you'd hit `Files * 4` connections, causing browser network stalls.
2.  **Backend Smoothness:** Instead of one massive 10GB load hitting your extract/Celery logic at once, you feed it 1GB chunks every minute or so.
    *   This keeps your Celery queue flowing steadily.
    *   It prevents Redis memory spikes.
    *   It reduces the risk of Nginx timeouts on the "Finalize" request (the request that merges the chunks).
3.  **User Experience:** The user sees immediate feedback. If File 3 fails, File 1 and 2 are already done (Batch IDs received), and File 4 continues processing. They only need to retry the specific failed file.
