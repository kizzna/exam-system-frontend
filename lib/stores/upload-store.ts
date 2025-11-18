import { create } from 'zustand';

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

interface UploadState {
  uploads: UploadProgress[];
  addUpload: (upload: UploadProgress) => void;
  updateUpload: (fileId: string, updates: Partial<UploadProgress>) => void;
  removeUpload: (fileId: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  uploads: [],

  addUpload: (upload) =>
    set((state) => ({
      uploads: [...state.uploads, upload],
    })),

  updateUpload: (fileId, updates) =>
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.fileId === fileId ? { ...upload, ...updates } : upload
      ),
    })),

  removeUpload: (fileId) =>
    set((state) => ({
      uploads: state.uploads.filter((upload) => upload.fileId !== fileId),
    })),

  clearCompleted: () =>
    set((state) => ({
      uploads: state.uploads.filter((upload) => upload.status !== 'completed'),
    })),

  clearAll: () => set({ uploads: [] }),
}));
