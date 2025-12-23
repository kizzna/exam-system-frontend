/**
 * BatchUploadForm Component
 * Supports multiple ZIP file uploads with queue management
 */

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery } from '@tanstack/react-query';
import { profilesAPI } from '@/lib/api/profiles';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUploadQueueStore } from '@/lib/stores/upload-queue-store';
import { useUploadQueueProcessor } from '@/lib/hooks/use-upload-processor';
import { CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BatchProgressItem } from './BatchProgressItem';
import { AlignmentMode } from '@/lib/types/batches';
import { toast } from 'sonner';

export function BatchUploadForm() {
  // Initialize queue processor
  useUploadQueueProcessor();

  const { queue, addFiles, removeItem, resetQueue, isProcessing } = useUploadQueueStore();

  const [notes, setNotes] = useState('');
  const [profileId, setProfileId] = useState<string>('');
  const [alignmentMode, setAlignmentMode] = useState<AlignmentMode>('standard');

  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.is_admin || false;

  // Fetch profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: profilesAPI.getAll,
  });

  // Set default profile
  if (!profileId && profiles.length > 0) {
    const defaultProfile = profiles.find((p) => p.is_default);
    if (defaultProfile) {
      setProfileId(defaultProfile.id.toString());
    } else {
      setProfileId(profiles[0].id.toString());
    }
  }

  // Handle drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter out files larger than 3GB
    const MAX_SIZE = 3 * 1024 * 1024 * 1024; // 3GB
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];

    acceptedFiles.forEach(file => {
      if (file.size > MAX_SIZE) {
        invalidFiles.push(file);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`ไฟล์ที่ขนาดเกิน 3GB: ${invalidFiles.map(f => f.name).join(', ')}`);
    }

    if (validFiles.length > 0) {
      addFiles(validFiles, {
        uploadType: 'zip_with_qr',
        taskId: null, // Not required for zip_with_qr
        notes: notes || undefined,
        profileId: profileId ? parseInt(profileId) : undefined,
        alignmentMode: alignmentMode !== 'hybrid' ? alignmentMode : undefined
      });
    }
  }, [addFiles, notes, profileId, alignmentMode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip']
    }
  });

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>

          {/* Settings Section */}
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            {/* Profile Selection */}
            <div className="space-y-2">
              <Label htmlFor="profile">Profile ตรวจใบตอบ</Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id.toString()}>
                      {profile.name} {profile.is_default && '(Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Alignment Strategy - Admin Only */}
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="alignment">วิธีปรับภาพให้ตรง (Advanced)</Label>
                <Select value={alignmentMode} onValueChange={(v) => setAlignmentMode(v as AlignmentMode)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hybrid">
                      Auto / Hybrid
                    </SelectItem>
                    <SelectItem value="standard">
                      Standard Only (Fast, Strict) (Default)
                    </SelectItem>
                    <SelectItem value="imreg_dft">
                      Force Robust (Slow, DFT)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Hybrid tries Standard first, falls back to Robust if needed.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <CloudUpload className="h-10 w-10 text-muted-foreground" />
          <div className="text-lg font-medium text-foreground">
            {isDragActive ? "Drop the files here..." : "ลากไฟล์ ZIP มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์"}
          </div>
          <p className="text-sm text-muted-foreground">
            รองรับการอัปโหลดหลายไฟล์พร้อมกัน (ระบบจะทยอยอัปโหลดทีละไฟล์)
          </p>
        </div>

        {/* Queue List */}
        {queue.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground">รายการอัปโหลด ({queue.length})</h4>
              {isProcessing && <span className="text-xs text-blue-600 animate-pulse">กำลังประมวลผล...</span>}
              {!isProcessing && queue.some(i => i.status === 'completed' || i.status === 'error') && (
                <Button variant="ghost" size="sm" onClick={resetQueue} className="text-xs h-7">
                  ล้างรายการ
                </Button>
              )}
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {queue.map((item) => (
                <BatchProgressItem key={item.id} item={item} onRemove={removeItem} />
              ))}
            </div>
          </div>
        )}

      </div>
    </Card>
  );
}
