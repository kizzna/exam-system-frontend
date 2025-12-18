/**
 * ImageUploadForm Component
 * Moved from BatchUploadForm for direct image upload from OMR Editor
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImagesUpload } from '@/lib/hooks/use-batches';
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
import type { ChunkUploadProgress } from '@/lib/types/batches';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploadFormProps {
    taskId?: string;
    onSuccess?: () => void;
}

export function ImageUploadForm({ taskId: propTaskId, onSuccess }: ImageUploadFormProps) {
    const router = useRouter();
    const imagesUpload = useImagesUpload();

    // Form state
    const [files, setFiles] = useState<File[]>([]);
    const [taskId, setTaskId] = useState(propTaskId || '');
    const [notes, setNotes] = useState('');
    const [profileId, setProfileId] = useState<string>('');

    // Update taskId if prop changes
    useState(() => {
        if (propTaskId) {
            setTaskId(propTaskId);
        }
    });

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

    // Upload progress state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<ChunkUploadProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    // Validation
    const isValid = () => {
        return files.length > 0 && /^\d{8}$/.test(taskId);
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

        const controller = new AbortController();
        setAbortController(controller);

        try {
            const result = await imagesUpload.mutateAsync({
                files,
                taskId,
                notes: notes || null,
                profileId: profileId ? parseInt(profileId) : null,
                onProgress: (progress) => setUploadProgress(progress),
                signal: controller.signal,
            });

            if (result) {
                if (onSuccess) {
                    onSuccess();
                } else {
                    // Navigate to batch details to monitor processing
                    router.push(`/dashboard/batches/${result.batch_id}`);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
            setUploading(false);
        } finally {
            setAbortController(null);
        }
    };

    const handleCancelUpload = () => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
            setUploading(false);
            setError('Upload cancelled by user');
            setUploadProgress(null);
        }
    };

    // Reset form
    const handleReset = () => {
        setFiles([]);
        if (!propTaskId) {
            setTaskId('');
        }
        setNotes('');
        // Reset profile to default
        const defaultProfile = profiles.find((p) => p.is_default);
        if (defaultProfile) {
            setProfileId(defaultProfile.id.toString());
        } else if (profiles.length > 0) {
            setProfileId(profiles[0].id.toString());
        } else {
            setProfileId('');
        }
        setError(null);
        setUploadProgress(null);
        setUploading(false);
    };

    // React Dropzone
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            setFiles(prev => [...prev, ...acceptedFiles]);
            setError(null);
        },
        accept: {
            'image/jpeg': ['.jpg', '.jpeg']
        },
        disabled: uploading
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Only show card wrapper if not in modal mode (when taskId prop is missing)
    const Content = (
        <div className="space-y-6">
            <div>
                {!propTaskId && <h3 className="mb-4 text-lg font-semibold">อัปโหลดรูปภาพ</h3>}
            </div>

            {/* File Upload Area */}
            <div className="space-y-2">
                <Label>ไฟล์รูปภาพ</Label>
                <div
                    {...getRootProps()}
                    className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'}
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2">
                        <UploadCloud className={`w-10 h-10 ${isDragActive ? 'text-primary' : 'text-slate-400'}`} />
                        <div className="text-sm font-medium text-slate-700">
                            {isDragActive ? 'วางไฟล์ที่นี่' : 'ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์'}
                        </div>
                        <div className="text-xs text-slate-500">
                            รองรับไฟล์ .jpg, .jpeg (อัปโหลดได้หลายไฟล์)
                        </div>
                    </div>
                </div>

                {/* Selected Files List */}
                {files.length > 0 && (
                    <div className="bg-slate-50 rounded-md border p-2 space-y-2 max-h-[200px] overflow-y-auto">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-2">
                            <span>{files.length} ไฟล์ที่เลือก ({(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB)</span>
                            <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="h-5 text-xs text-red-500 hover:text-red-600">
                                ล้างทั้งหมด
                            </Button>
                        </div>
                        <div className="space-y-1">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border text-sm group">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center shrink-0">
                                            <span className="text-[10px] font-mono text-slate-500">JPG</span>
                                        </div>
                                        <span className="truncate max-w-[200px]">{file.name}</span>
                                        <span className="text-xs text-slate-400 whitespace-nowrap">
                                            ({(file.size / 1024).toFixed(0)} KB)
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeFile(idx)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

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

            {/* Task ID - Hide if provided via props */}
            {!propTaskId && (
                <div className="space-y-2">
                    <Label htmlFor="task_id">
                        Task ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="task_id"
                        type="text"
                        placeholder="Task ID (เช่น 14900112 ตัวเลข 8 หลัก)"
                        value={taskId}
                        onChange={(e) => setTaskId(e.target.value)}
                        disabled={uploading}
                        maxLength={8}
                        pattern="\d{8}"
                    />
                </div>
            )}

            {/* Notes (optional) */}
            {/* <div className="space-y-2">
                <Label htmlFor="notes">หมายเหตุ (ใส่หรือไม่ใส่ก็ได้)</Label>
                <Input
                    id="notes"
                    type="text"
                    placeholder="เพิ่มหมายเหตุเกี่ยวกับข้อมูลนี้"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={uploading}
                />
            </div> */}

            {/* Upload Progress */}
            {uploading && uploadProgress && (
                <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                            กำลังอัปโหลด...
                        </span>
                        <span className="font-mono">{Math.round(uploadProgress.percentage)}%</span>
                    </div>
                    <Progress value={uploadProgress.percentage} className="h-2" />
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
                    {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
                </Button>

                {uploading && (
                    <Button variant="destructive" onClick={handleCancelUpload}>
                        ยกเลิกอัปโหลด
                    </Button>
                )}

                {!uploading && files.length > 0 && (
                    <Button variant="outline" onClick={handleReset}>
                        ล้าง
                    </Button>
                )}
            </div>
        </div>
    );

    if (propTaskId) {
        return Content;
    }

    return (
        <Card className="p-6">
            {Content}
        </Card>
    );
}
