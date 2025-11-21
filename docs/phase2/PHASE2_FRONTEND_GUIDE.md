# Phase 2 Frontend Development Guide

**Backend Phase:** Phase 2 - Batch Upload & Processing (Complete ✅)  
**Frontend Stack:** Next.js 15 LTS (React 18/19)  
**Date:** November 19, 2025  
**Status:** Ready for Frontend Implementation

---

## Overview

This guide provides complete specifications for implementing the **Batch Upload and Processing** features in the Next.js 15 frontend. All backend endpoints are deployed and tested on production servers (gt-omr-api-1, gt-omr-api-2).

### What's Included in Phase 2

1. **Batch Upload System** - Three upload strategies with automatic detection
2. **Real-time Progress Tracking** - WebSocket-ready progress polling
3. **Batch Management** - List, view, and delete batches
4. **Advanced Filtering** - Status-based filtering and pagination

### Frontend Implementation Priority

1. **Week 1:** Upload Interface (File drop zone, upload strategies)
2. **Week 2:** Progress Tracking (Real-time updates, progress bars)
3. **Week 3:** Batch Management (List view, detail view, delete)

---

## Base URL & Environment

### API Base URL

```env
# .env.local
NEXT_PUBLIC_API_URL=http://gt-omr-api-1:8000
```

### API Documentation

- **Swagger UI:** http://gt-omr-api-1:8000/docs
- **ReDoc:** http://gt-omr-api-1:8000/redoc
- **OpenAPI JSON:** http://gt-omr-api-1:8000/openapi.json

---

## Authentication Requirement

**All Phase 2 endpoints require JWT authentication from Phase 1.**

```typescript
// Add to all requests
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

For authentication setup, refer to **PHASE1_FRONTEND_GUIDE.md**.

---

## TypeScript Type Definitions

### Core Types

```typescript
/**
 * Batch processing status enum
 */
type BatchStatus = 
  | 'uploaded'      // Initial state after upload
  | 'validating'    // Validating files
  | 'processing'    // OMR processing in progress
  | 'completed'     // Successfully completed
  | 'failed'        // Processing failed
  | 'reprocessing'; // Re-running failed sheets

/**
 * Upload strategy types
 */
type UploadType = 
  | 'zip_qr'      // ZIP file with QR codes on sheets
  | 'zip_no_qr'   // ZIP file without QR codes
  | 'images';     // Direct image files upload

/**
 * Batch entity (from database)
 */
interface Batch {
  batch_id: number;              // Integer ID (internal)
  batch_uuid: string;            // UUID (for API calls)
  batch_name: string;            // Original filename
  upload_type: UploadType;       // Upload strategy used
  status: BatchStatus;           // Current processing status
  sheet_count: number;           // Total sheets in batch
  file_size_bytes: number;       // Upload file size
  created_at: string;            // ISO 8601 timestamp
  processing_started_at: string | null;
  completed_at: string | null;
  error_message: string | null;  // Error details if failed
  notes: string | null;          // User-provided notes
}

/**
 * Progress tracking data
 */
interface BatchProgress {
  batch_uuid: string;
  status: BatchStatus;
  sheet_count: number;
  processed_count: number;       // Sheets completed
  failed_count: number;          // Sheets failed
  progress_percentage: number;   // 0-100
  created_at: string;
  completed_at: string | null;
}

/**
 * Sheet-level status (optional detail)
 */
interface SheetStatus {
  sheet_uuid: string;
  sheet_number: number;
  status: BatchStatus;
  processing_time_ms: number | null;
  error_message: string | null;
  image_path: string;
}

/**
 * Detailed batch status response
 */
interface BatchStatusResponse {
  batch_uuid: string;
  status: BatchStatus;
  upload_type: UploadType;
  total_sheets: number;
  processed_sheets: number;
  failed_sheets: number;
  progress_percentage: number;
  created_at: string;
  processing_started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  sheets?: SheetStatus[];        // Optional, when include_sheets=true
}
```

---

## 1. Batch Upload

### 1.1 Upload Batch (POST /api/batches/upload)

**Endpoint:** `POST /api/batches/upload`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

#### Upload Strategies

The backend supports three upload strategies that are automatically detected:

| Strategy | Description | Required Fields |
|----------|-------------|-----------------|
| **ZIP with QR** | ZIP file containing images with QR codes | `file`, `has_qr=true` |
| **ZIP without QR** | ZIP file without QR codes | `file`, `has_qr=false`, `task_id` |
| **Direct Images** | Multiple image files | `files[]`, `task_id` |

#### Request Parameters

```typescript
interface UploadBatchRequest {
  // For ZIP uploads (Strategy 1 & 2)
  file?: File;                   // ZIP file
  
  // For direct image uploads (Strategy 3)
  files?: File[];                // Array of image files
  
  // Required for non-QR uploads
  task_id?: string;              // 8-digit task ID (e.g., "14900113")
  
  // QR code flag
  has_qr?: boolean;              // Default: true
  
  // Optional metadata
  notes?: string;                // User notes
  user_id?: string;              // Override user (admin only)
}
```

#### Response (202 Accepted)

```typescript
interface UploadBatchResponse {
  batch_id: string;              // UUID for tracking
  status: "uploaded";
  message: string;               // Success message
  total_size: number;            // Bytes uploaded
}
```

#### Example: Upload ZIP with QR Codes

```typescript
async function uploadZipWithQR(file: File, notes?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('has_qr', 'true');
  if (notes) formData.append('notes', notes);

  const response = await fetch(`${API_URL}/api/batches/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return await response.json() as UploadBatchResponse;
}
```

#### Example: Upload ZIP without QR Codes

```typescript
async function uploadZipNoQR(file: File, taskId: string, notes?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('has_qr', 'false');
  formData.append('task_id', taskId);  // Required!
  if (notes) formData.append('notes', notes);

  const response = await fetch(`${API_URL}/api/batches/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });

  return await response.json() as UploadBatchResponse;
}
```

#### Example: Upload Direct Images

```typescript
async function uploadImages(files: File[], taskId: string, notes?: string) {
  const formData = new FormData();
  
  // Append multiple files
  files.forEach(file => {
    formData.append('files', file);
  });
  
  formData.append('task_id', taskId);  // Required!
  if (notes) formData.append('notes', notes);

  const response = await fetch(`${API_URL}/api/batches/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });

  return await response.json() as UploadBatchResponse;
}
```

#### React Component Example: Upload Form

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type UploadStrategy = 'zip_qr' | 'zip_no_qr' | 'images';

export function BatchUploadForm() {
  const router = useRouter();
  const [strategy, setStrategy] = useState<UploadStrategy>('zip_qr');
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [taskId, setTaskId] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();

      if (strategy === 'zip_qr') {
        if (!file) throw new Error('Please select a ZIP file');
        formData.append('file', file);
        formData.append('has_qr', 'true');
      } else if (strategy === 'zip_no_qr') {
        if (!file) throw new Error('Please select a ZIP file');
        if (!taskId) throw new Error('Task ID is required');
        formData.append('file', file);
        formData.append('has_qr', 'false');
        formData.append('task_id', taskId);
      } else {
        if (files.length === 0) throw new Error('Please select image files');
        if (!taskId) throw new Error('Task ID is required');
        files.forEach(f => formData.append('files', f));
        formData.append('task_id', taskId);
      }

      if (notes) formData.append('notes', notes);

      const response = await fetch('/api/batches/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      
      // Redirect to progress tracking page
      router.push(`/batches/${result.batch_id}/progress`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Strategy Selection */}
      <div>
        <label className="block text-sm font-medium">Upload Strategy</label>
        <select 
          value={strategy} 
          onChange={(e) => setStrategy(e.target.value as UploadStrategy)}
          className="mt-1 block w-full rounded border p-2"
        >
          <option value="zip_qr">ZIP with QR Codes</option>
          <option value="zip_no_qr">ZIP without QR Codes</option>
          <option value="images">Direct Images</option>
        </select>
      </div>

      {/* File Upload */}
      {(strategy === 'zip_qr' || strategy === 'zip_no_qr') && (
        <div>
          <label className="block text-sm font-medium">ZIP File</label>
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full"
          />
        </div>
      )}

      {strategy === 'images' && (
        <div>
          <label className="block text-sm font-medium">Image Files</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="mt-1 block w-full"
          />
        </div>
      )}

      {/* Task ID (required for non-QR uploads) */}
      {(strategy === 'zip_no_qr' || strategy === 'images') && (
        <div>
          <label className="block text-sm font-medium">
            Task ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            placeholder="14900113"
            pattern="[0-9]{8}"
            className="mt-1 block w-full rounded border p-2"
            required
          />
          <p className="text-xs text-gray-500 mt-1">8-digit task identifier</p>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full rounded border p-2"
          rows={3}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={uploading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload Batch'}
      </button>
    </form>
  );
}
```

---

## 2. Progress Tracking

### 2.1 Get Batch Progress (GET /api/batches/{batch_id}/progress)

**Endpoint:** `GET /api/batches/{batch_id}/progress`  
**Authentication:** Required  
**Purpose:** Lightweight endpoint for real-time progress polling

#### Response (200 OK)

```typescript
interface BatchProgress {
  batch_uuid: string;
  status: BatchStatus;
  sheet_count: number;
  processed_count: number;
  failed_count: number;
  progress_percentage: number;  // 0-100
  created_at: string;           // ISO 8601
  completed_at: string | null;  // ISO 8601 or null
}
```

#### Example: Fetch Progress

```typescript
async function getBatchProgress(batchId: string): Promise<BatchProgress> {
  const response = await fetch(
    `${API_URL}/api/batches/${batchId}/progress`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch progress');
  }

  return await response.json();
}
```

#### React Hook: Real-time Progress Polling

```typescript
'use client';

import { useState, useEffect } from 'react';

interface UseProgressPollingOptions {
  batchId: string;
  interval?: number;  // Milliseconds, default 2000
  enabled?: boolean;
}

export function useProgressPolling({ 
  batchId, 
  interval = 2000,
  enabled = true 
}: UseProgressPollingOptions) {
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const fetchProgress = async () => {
      try {
        const response = await fetch(
          `/api/batches/${batchId}/progress`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch progress');

        const data = await response.json();
        setProgress(data);
        setError(null);

        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchProgress();

    // Set up polling
    const pollInterval = setInterval(fetchProgress, interval);

    return () => clearInterval(pollInterval);
  }, [batchId, interval, enabled]);

  return { progress, error, isLoading };
}
```

#### React Component: Progress Bar

```typescript
'use client';

import { useProgressPolling } from '@/hooks/useProgressPolling';

interface ProgressBarProps {
  batchId: string;
}

export function BatchProgressBar({ batchId }: ProgressBarProps) {
  const { progress, error, isLoading } = useProgressPolling({ batchId });

  if (isLoading) {
    return <div>Loading progress...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (!progress) {
    return null;
  }

  const getStatusColor = (status: BatchStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'processing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-2">
      {/* Status Badge */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          Status: <span className="capitalize">{progress.status}</span>
        </span>
        <span className="text-sm text-gray-600">
          {progress.processed_count} / {progress.sheet_count} sheets
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className={`h-4 rounded-full transition-all duration-500 ${getStatusColor(progress.status)}`}
          style={{ width: `${progress.progress_percentage}%` }}
        />
      </div>

      {/* Percentage */}
      <div className="text-center text-sm text-gray-600">
        {progress.progress_percentage.toFixed(1)}%
      </div>

      {/* Failed Count */}
      {progress.failed_count > 0 && (
        <div className="text-sm text-red-600">
          ⚠️ {progress.failed_count} sheet(s) failed
        </div>
      )}

      {/* Completed Time */}
      {progress.completed_at && (
        <div className="text-sm text-gray-500">
          Completed: {new Date(progress.completed_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
```

---

## 3. Batch Status (Detailed)

### 3.1 Get Batch Status (GET /api/batches/{batch_id}/status)

**Endpoint:** `GET /api/batches/{batch_id}/status`  
**Authentication:** Required  
**Purpose:** Get comprehensive batch information with optional sheet-level details

#### Query Parameters

```typescript
interface StatusQueryParams {
  include_sheets?: boolean;  // Include individual sheet statuses
  limit?: number;            // Max sheets to return (default: 100, max: 1000)
}
```

#### Response (200 OK)

```typescript
interface BatchStatusResponse {
  batch_uuid: string;
  status: BatchStatus;
  upload_type: UploadType;
  total_sheets: number;
  processed_sheets: number;
  failed_sheets: number;
  progress_percentage: number;
  created_at: string;
  processing_started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  sheets?: SheetStatus[];        // Only if include_sheets=true
}

interface SheetStatus {
  sheet_uuid: string;
  sheet_number: number;
  status: BatchStatus;
  processing_time_ms: number | null;
  error_message: string | null;
  image_path: string;
}
```

#### Example: Fetch Detailed Status

```typescript
async function getBatchStatus(
  batchId: string, 
  includeSheets = false,
  limit = 100
): Promise<BatchStatusResponse> {
  const params = new URLSearchParams({
    include_sheets: includeSheets.toString(),
    limit: limit.toString()
  });

  const response = await fetch(
    `${API_URL}/api/batches/${batchId}/status?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch batch status');
  }

  return await response.json();
}
```

#### React Component: Batch Detail View

```typescript
'use client';

import { useEffect, useState } from 'react';

interface BatchDetailProps {
  batchId: string;
}

export function BatchDetailView({ batchId }: BatchDetailProps) {
  const [status, setStatus] = useState<BatchStatusResponse | null>(null);
  const [showSheets, setShowSheets] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, [batchId, showSheets]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/batches/${batchId}/status?include_sheets=${showSheets}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!status) return <div>Batch not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Batch Details</h2>
        <p className="text-gray-500">{status.batch_uuid}</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Status</div>
          <div className="text-xl font-semibold capitalize">{status.status}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Upload Type</div>
          <div className="text-xl font-semibold">{status.upload_type}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Sheets</div>
          <div className="text-xl font-semibold">{status.total_sheets}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Progress</div>
          <div className="text-xl font-semibold">
            {status.progress_percentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Processing Stats */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Processing Statistics</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Processed:</span>
            <span className="font-medium">{status.processed_sheets}</span>
          </div>
          <div className="flex justify-between">
            <span>Failed:</span>
            <span className="font-medium text-red-600">{status.failed_sheets}</span>
          </div>
          {status.created_at && (
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(status.created_at).toLocaleString()}</span>
            </div>
          )}
          {status.completed_at && (
            <div className="flex justify-between">
              <span>Completed:</span>
              <span>{new Date(status.completed_at).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {status.error_message && (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <h3 className="font-semibold text-red-700 mb-2">Error</h3>
          <p className="text-red-600">{status.error_message}</p>
        </div>
      )}

      {/* Sheet Details Toggle */}
      <button
        onClick={() => setShowSheets(!showSheets)}
        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
      >
        {showSheets ? 'Hide' : 'Show'} Sheet Details
      </button>

      {/* Sheet List */}
      {showSheets && status.sheets && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-4">Individual Sheets</h3>
          <div className="space-y-2">
            {status.sheets.map((sheet) => (
              <div
                key={sheet.sheet_uuid}
                className="flex justify-between items-center p-2 border rounded"
              >
                <span>Sheet #{sheet.sheet_number}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  sheet.status === 'completed' ? 'bg-green-100 text-green-700' :
                  sheet.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {sheet.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 4. List Batches

### 4.1 List Batches (GET /api/batches/)

**Endpoint:** `GET /api/batches/`  
**Authentication:** Required  
**Purpose:** Get paginated list of batches

#### Query Parameters

```typescript
interface ListBatchesParams {
  status?: BatchStatus;  // Filter by status
  limit?: number;        // Results per page (1-100, default: 50)
  offset?: number;       // Pagination offset (default: 0)
}
```

#### Response (200 OK)

```typescript
interface ListBatchesResponse {
  total: number;         // Total batches matching filters
  limit: number;
  offset: number;
  batches: Batch[];
}
```

#### Example: Fetch Batch List

```typescript
async function listBatches(
  status?: BatchStatus,
  limit = 50,
  offset = 0
): Promise<ListBatchesResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });
  
  if (status) {
    params.append('status', status);
  }

  const response = await fetch(
    `${API_URL}/api/batches/?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  return await response.json();
}
```

#### React Component: Batch List with Pagination

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function BatchList() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BatchStatus | ''>('');
  const [loading, setLoading] = useState(true);

  const limit = 20;

  useEffect(() => {
    fetchBatches();
  }, [page, statusFilter]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(
        `/api/batches/?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      const data = await response.json();
      setBatches(data.batches);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusBadge = (status: BatchStatus) => {
    const colors = {
      uploaded: 'bg-gray-100 text-gray-700',
      validating: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      reprocessing: 'bg-purple-100 text-purple-700'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Batches ({total})</h2>
        
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as BatchStatus);
            setPage(1);
          }}
          className="border rounded px-3 py-2"
        >
          <option value="">All Statuses</option>
          <option value="uploaded">Uploaded</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Batch Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Batch Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Sheets</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Size</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No batches found
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch.batch_uuid} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{batch.batch_name}</div>
                    <div className="text-xs text-gray-500">{batch.batch_uuid.slice(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(batch.status)}
                  </td>
                  <td className="px-4 py-3 text-sm">{batch.upload_type}</td>
                  <td className="px-4 py-3 text-right">{batch.sheet_count}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    {formatFileSize(batch.file_size_bytes)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(batch.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/batches/${batch.batch_uuid}`)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Delete Batch

### 5.1 Delete Batch (DELETE /api/batches/{batch_id})

**Endpoint:** `DELETE /api/batches/{batch_id}`  
**Authentication:** Required (Admin Only)  
**Purpose:** Delete a batch from the system

#### Permissions

- **Admin Only:** Only administrators can delete batches
- Non-admin users will receive a 403 Forbidden error

#### Notes

- Hard delete - batch is permanently removed from database
- Use with caution - no audit trail in MVP version
- Future enhancement: Add soft delete with audit logging

#### Response (204 No Content)

Successful deletion returns HTTP 204 with no body.

#### Error Responses

```typescript
// 403 Forbidden - Not admin
{
  "error": "HTTPException",
  "message": "Only administrators can delete batches",
  "status_code": 403
}

// 404 Not Found
{
  "error": "HTTPException",
  "message": "Batch {batch_id} not found",
  "status_code": 404
}
```

#### Example: Delete Batch

```typescript
async function deleteBatch(batchId: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/batches/${batchId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  // Success - no response body (204)
}
```

#### React Component: Delete Button with Confirmation

```typescript
'use client';

import { useState } from 'react';

interface DeleteBatchButtonProps {
  batch: Batch;
  onDeleted?: () => void;
}

export function DeleteBatchButton({ batch, onDeleted }: DeleteBatchButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current user from auth context
  const { user } = useAuth(); // Assuming you have an auth context
  const isAdmin = user?.is_admin || false;

  // Only admins can delete
  if (!isAdmin) {
    return null; // Hide delete button for non-admins
  }

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(
        `/api/batches/${batch.batch_uuid}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // Success
      setShowConfirm(false);
      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };



  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:underline text-sm"
      >
        Delete
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete batch <strong>{batch.batch_name}</strong>?
              This action cannot be undone.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 6. Complete Implementation Examples

### 6.1 API Service Layer

```typescript
// lib/api/batches.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

class BatchesAPI {
  private getAuthHeader() {
    const token = localStorage.getItem('access_token');
    return { 'Authorization': `Bearer ${token}` };
  }

  async upload(formData: FormData): Promise<UploadBatchResponse> {
    const response = await fetch(`${API_URL}/api/batches/upload`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  async getProgress(batchId: string): Promise<BatchProgress> {
    const response = await fetch(
      `${API_URL}/api/batches/${batchId}/progress`,
      { headers: this.getAuthHeader() }
    );

    if (!response.ok) throw new Error('Failed to fetch progress');
    return response.json();
  }

  async getStatus(
    batchId: string, 
    includeSheets = false,
    limit = 100
  ): Promise<BatchStatusResponse> {
    const params = new URLSearchParams({
      include_sheets: includeSheets.toString(),
      limit: limit.toString()
    });

    const response = await fetch(
      `${API_URL}/api/batches/${batchId}/status?${params}`,
      { headers: this.getAuthHeader() }
    );

    if (!response.ok) throw new Error('Failed to fetch status');
    return response.json();
  }

  async list(
    status?: BatchStatus,
    limit = 50,
    offset = 0
  ): Promise<ListBatchesResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (status) params.append('status', status);

    const response = await fetch(
      `${API_URL}/api/batches/?${params}`,
      { headers: this.getAuthHeader() }
    );

    if (!response.ok) throw new Error('Failed to fetch batches');
    return response.json();
  }

  async delete(batchId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/api/batches/${batchId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeader()
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
  }
}

export const batchesAPI = new BatchesAPI();
```

### 6.2 Complete Page Example

```typescript
// app/batches/page.tsx

'use client';

import { useState } from 'react';
import { BatchList } from '@/components/batches/BatchList';
import { BatchUploadForm } from '@/components/batches/BatchUploadForm';

export default function BatchesPage() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">OMR Batches</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          + Upload New Batch
        </button>
      </div>

      {showUpload && (
        <div className="mb-6 bg-white p-6 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upload Batch</h2>
            <button
              onClick={() => setShowUpload(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Close
            </button>
          </div>
          <BatchUploadForm />
        </div>
      )}

      <BatchList />
    </div>
  );
}
```

---

## 7. Error Handling

### Common Error Codes

```typescript
interface APIError {
  error: string;
  message: string;
  status_code: number;
  path: string;
}

// 401 Unauthorized - Invalid or expired token
{
  "error": "HTTPException",
  "message": "Not authenticated",
  "status_code": 403
}

// 404 Not Found - Batch doesn't exist
{
  "error": "HTTPException",
  "message": "Batch {batch_id} not found",
  "status_code": 404
}

// 400 Bad Request - Validation error
{
  "error": "HTTPException",
  "message": "Task ID is required for non-QR uploads",
  "status_code": 400
}

// 413 Payload Too Large - File size limit exceeded
{
  "error": "HTTPException",
  "message": "File size exceeds maximum allowed size",
  "status_code": 413
}
```

### Error Handler Utility

```typescript
// lib/utils/errorHandler.ts

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public errorType: string,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw new APIError(
      error.status_code || response.status,
      error.error || 'UnknownError',
      error.message || 'An unexpected error occurred'
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
```

---

## 8. Testing Checklist

### Upload Functionality

- [ ] Upload ZIP with QR codes (large file ~200MB)
- [ ] Upload ZIP without QR codes (with valid task_id)
- [ ] Upload direct images (1 image, 10 images, 100 images)
- [ ] Validate task_id format (8 digits)
- [ ] Handle upload errors (network, file size, invalid format)
- [ ] Show upload progress indicator

### Progress Tracking

- [ ] Real-time progress updates (polling every 2 seconds)
- [ ] Progress bar updates smoothly
- [ ] Stop polling when completed/failed
- [ ] Display processed/failed counts
- [ ] Handle progress fetch errors gracefully

### Batch Management

- [ ] List batches with pagination
- [ ] Filter by status (uploaded, processing, completed, failed)
- [ ] Sort by upload date (newest first)
- [ ] View detailed batch information
- [ ] Display sheet-level details
- [ ] Navigate between batch list and detail views

### Delete Functionality

- [ ] Disable delete for processing/completed batches
- [ ] Confirm before deletion
- [ ] Display deletion errors clearly
- [ ] Refresh list after successful deletion
- [ ] Hide delete button for non-admin users

### Authentication

- [ ] All endpoints require valid JWT token
- [ ] Handle token expiration (redirect to login)
- [ ] Refresh token when expired
- [ ] Store token securely

---

## 9. Performance Considerations

### File Upload Optimization

```typescript
// Chunked upload for large files (future enhancement)
async function uploadWithProgress(
  formData: FormData,
  onProgress: (percentage: number) => void
) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentage = (e.loaded / e.total) * 100;
        onProgress(percentage);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.open('POST', `${API_URL}/api/batches/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send(formData);
  });
}
```

### Progress Polling Optimization

```typescript
// Adaptive polling interval based on batch size
function getPollingInterval(sheetCount: number): number {
  if (sheetCount < 10) return 1000;      // 1 second
  if (sheetCount < 100) return 2000;     // 2 seconds
  if (sheetCount < 1000) return 5000;    // 5 seconds
  return 10000;                           // 10 seconds
}
```

---

## 10. Next Steps

1. **Implement Upload Interface** - Drag-and-drop file upload with strategy selection
2. **Build Progress Dashboard** - Real-time monitoring of batch processing
3. **Create Batch Management UI** - List, filter, and detail views
4. **Add Notifications** - Toast notifications for upload success/failure
5. **Integrate WebSocket** (Future) - Replace polling with WebSocket for real-time updates

---

## 11. Support & Resources

- **Backend Swagger:** http://gt-omr-api-1:8000/docs
- **Testing Guide:** See `PHASE2_TESTING_COMPLETE.md`
- **Quick Reference:** See `PHASE2_QUICK_START.md`
- **Architecture:** See `SIMPLIFIED_API_CENTRIC_ARCHITECTURE.md`

---

**Document Version:** 1.0  
**Last Updated:** November 19, 2025  
**Status:** ✅ Ready for Implementation
