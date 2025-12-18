/**
 * BatchUploadForm Component
 * Supports multiple ZIP file uploads with queue management
 */

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery } from '@tanstack/react-query';
import { profilesAPI } from '@/lib/api/profiles';
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

export function BatchUploadForm() {
  // Initialize queue processor
  useUploadQueueProcessor();

  const { queue, addFiles, removeItem, resetQueue, isProcessing } = useUploadQueueStore();

  const [notes, setNotes] = useState('');
  const [profileId, setProfileId] = useState<string>('');

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
    addFiles(acceptedFiles, {
      uploadType: 'zip_with_qr',
      taskId: null, // Not required for zip_with_qr
      notes: notes || undefined,
      profileId: profileId ? parseInt(profileId) : undefined
    });
  }, [addFiles, notes, profileId]);

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
          <h3 className="mb-4 text-lg font-semibold">อัปโหลดใบคำตอบ (ZIP)</h3>

          {/* Settings Section */}
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            {/* Profile Selection */}
            <div className="space-y-2">
              <Label htmlFor="profile">Profile ตรวจข้อสอบ</Label>
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

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">หมายเหตุ (ทุกไฟล์)</Label>
              <Input
                id="notes"
                type="text"
                placeholder="เพิ่มหมายเหตุสำหรับชุดไฟล์นี้"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
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
