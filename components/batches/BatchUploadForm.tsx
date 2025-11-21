/**
 * BatchUploadForm Component
 * Phase 2: File upload with chunking support for files > 100MB
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBatchUpload, useImagesUpload } from '@/lib/hooks/use-batches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { UploadType, ChunkUploadProgress } from '@/lib/types/batches';

export function BatchUploadForm() {
  const router = useRouter();
  const batchUpload = useBatchUpload();
  const imagesUpload = useImagesUpload();

  // Form state
  const [uploadType, setUploadType] = useState<UploadType>('zip_with_qr');
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [taskId, setTaskId] = useState('');
  const [notes, setNotes] = useState('');

  // Upload progress state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ChunkUploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const taskIdRequired = uploadType === 'zip_no_qr' || uploadType === 'images';
  const isValid = () => {
    if (uploadType === 'images') {
      return files.length > 0 && (!taskIdRequired || /^\d{8}$/.test(taskId));
    } else {
      return file !== null && (!taskIdRequired || /^\d{8}$/.test(taskId));
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  // Handle multiple files selection
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setError(null);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!isValid()) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      let result;

      if (uploadType === 'images' && files.length > 0) {
        // Upload multiple images
        result = await imagesUpload.mutateAsync({
          files,
          taskId,
          notes: notes || null,
          onProgress: (progress) => setUploadProgress(progress),
        });
      } else if (file) {
        // Upload single file (ZIP)
        result = await batchUpload.mutateAsync({
          file,
          uploadType,
          taskId: taskIdRequired ? taskId : null,
          notes: notes || null,
          onProgress: (progress) => setUploadProgress(progress),
        });
      }

      if (result) {
        // Navigate to batch details to monitor processing
        router.push(`/dashboard/batches/${result.batch_id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setFiles([]);
    setTaskId('');
    setNotes('');
    setError(null);
    setUploadProgress(null);
    setUploading(false);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-semibold">Upload OMR Sheets</h3>

          {/* Upload Strategy Selection */}
          <div className="space-y-3">
            <Label>Upload Strategy</Label>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="upload_type"
                  value="zip_with_qr"
                  checked={uploadType === 'zip_with_qr'}
                  onChange={(e) => setUploadType(e.target.value as UploadType)}
                  disabled={uploading}
                  className="h-4 w-4"
                />
                <div>
                  <div className="font-medium">ZIP with QR Codes</div>
                  <div className="text-sm text-gray-600">
                    ZIP file containing images with QR codes (task ID extracted automatically)
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="upload_type"
                  value="zip_no_qr"
                  checked={uploadType === 'zip_no_qr'}
                  onChange={(e) => setUploadType(e.target.value as UploadType)}
                  disabled={uploading}
                  className="h-4 w-4"
                />
                <div>
                  <div className="font-medium">ZIP without QR Codes</div>
                  <div className="text-sm text-gray-600">
                    ZIP file without QR codes (requires task ID)
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="upload_type"
                  value="images"
                  checked={uploadType === 'images'}
                  onChange={(e) => setUploadType(e.target.value as UploadType)}
                  disabled={uploading}
                  className="h-4 w-4"
                />
                <div>
                  <div className="font-medium">Direct Images</div>
                  <div className="text-sm text-gray-600">
                    Individual image files (requires task ID)
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="file">
            {uploadType === 'images' ? 'Image Files' : 'ZIP File'}
            {uploadType === 'images' && ' (multiple)'}
          </Label>
          {uploadType === 'images' ? (
            <Input
              id="files"
              type="file"
              accept=".jpg,.jpeg,.png"
              multiple
              onChange={handleFilesChange}
              disabled={uploading}
            />
          ) : (
            <Input
              id="file"
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              disabled={uploading}
            />
          )}
          {uploadType === 'images' && files.length > 0 && (
            <div className="text-sm text-gray-600">
              {files.length} file{files.length !== 1 ? 's' : ''} selected (
              {(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
          {file && (
            <div className="text-sm text-gray-600">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              {file.size > 100 * 1024 * 1024 && (
                <span className="ml-2 font-medium text-blue-600">(Will use chunked upload)</span>
              )}
            </div>
          )}
        </div>

        {/* Task ID (conditional) */}
        {taskIdRequired && (
          <div className="space-y-2">
            <Label htmlFor="task_id">
              Task ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="task_id"
              type="text"
              placeholder="8-digit task ID (e.g., 14900117)"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              disabled={uploading}
              maxLength={8}
              pattern="\d{8}"
            />
            {taskId && !/^\d{8}$/.test(taskId) && (
              <div className="text-sm text-red-600">Task ID must be exactly 8 digits</div>
            )}
          </div>
        )}

        {/* Notes (optional) */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Input
            id="notes"
            type="text"
            placeholder="Add any notes about this batch"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={uploading}
          />
        </div>

        {/* Upload Progress */}
        {uploading && uploadProgress && (
          <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {uploadProgress.chunksTotal > 1
                  ? `Uploading chunk ${uploadProgress.currentChunk} / ${uploadProgress.chunksTotal}`
                  : 'Uploading...'}
              </span>
              <span className="font-mono">{Math.round(uploadProgress.percentage)}%</span>
            </div>
            <Progress value={uploadProgress.percentage} className="h-2" />
            <div className="text-xs text-gray-600">
              {(uploadProgress.bytesUploaded / 1024 / 1024).toFixed(2)} MB /{' '}
              {(uploadProgress.bytesTotal / 1024 / 1024).toFixed(2)} MB
            </div>
            {uploadProgress.chunksTotal > 1 && (
              <div className="text-xs text-blue-700">⚡ Using chunked upload for large file</div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-sm font-medium text-red-800">Upload Error</div>
            <div className="mt-1 text-sm text-red-600">{error}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleUpload} disabled={!isValid() || uploading} className="flex-1">
            {uploading ? 'Uploading...' : 'Upload Batch'}
          </Button>
          {!uploading && (file || files.length > 0) && (
            <Button variant="outline" onClick={handleReset}>
              Clear
            </Button>
          )}
        </div>

        {/* Info Text */}
        {!uploading && (
          <div className="space-y-1 text-xs text-gray-500">
            <div>• Files larger than 100MB will automatically use chunked upload</div>
            <div>• Maximum file size: 10GB (chunked)</div>
            <div>• Supported formats: ZIP files and JPG/PNG images</div>
          </div>
        )}
      </div>
    </Card>
  );
}
