import { useBatchProgress } from '@/lib/hooks/use-batches';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, FileArchive, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { QueueItem } from '@/lib/types/queue';

interface BatchProgressItemProps {
    item: QueueItem;
    onRemove: (id: string) => void;
}

export function BatchProgressItem({ item, onRemove }: BatchProgressItemProps) {
    // Poll progress if batchId exists and status is 'completed' (which really means upload completed)
    const { data: progressData } = useBatchProgress(
        item.batchId && item.status === 'completed' ? item.batchId : null,
        true
    );

    // Determine processing status based on polling
    const processingStatus = progressData?.status || 'processing';
    const processedCount = progressData?.processed_count || 0;
    const totalSheets = progressData?.sheet_count || 0;
    const failedCount = progressData?.failed_count || 0;
    const progressPercent = progressData?.progress_percentage || 0;

    const isFinished = processingStatus === 'completed' || processingStatus === 'failed';

    return (
        <div className="bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn(
                        "p-2 rounded-full",
                        item.status === 'completed'
                            ? (isFinished && processingStatus === 'failed' ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")
                            : item.status === 'error' || item.status === 'aborted'
                                ? "bg-red-100 text-red-600"
                                : "bg-blue-100 text-blue-600"
                    )}>
                        {item.status === 'completed' ? (
                            isFinished && processingStatus === 'failed' ? <AlertCircle className="h-4 w-4" /> :
                                isFinished ? <CheckCircle className="h-4 w-4" /> :
                                    <Loader2 className="h-4 w-4 animate-spin" />
                        ) : item.status === 'error' ? <AlertCircle className="h-4 w-4" /> :
                            item.status === 'uploading' ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                <FileArchive className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium truncate text-sm">{item.file.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                            {item.batchId && (
                                <Link href={`/dashboard/batches/${item.batchId}`} className="text-primary hover:underline">
                                    View Batch
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full capitalize font-medium",
                        item.status === 'completed'
                            ? (isFinished ? (processingStatus === 'failed' ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800") : "bg-yellow-100 text-yellow-800")
                            : item.status === 'error' ? "bg-red-100 text-red-800"
                                : item.status === 'uploading' ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                    )}>
                        {item.status === 'completed' ? (
                            isFinished ? processingStatus : 'Processing...'
                        ) : item.status}
                    </span>
                    {item.status === 'pending' && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(item.id)}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Upload Progress Bar */}
            {item.status === 'uploading' && (
                <div className="space-y-1">
                    <Progress value={item.progress} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Uploading... {(item.bytesUploaded / 1024 / 1024).toFixed(2)} / {(item.totalBytes / 1024 / 1024).toFixed(2)} MB</span>
                        <span>{Math.round(item.progress)}%</span>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {item.errorMessage && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    Error: {item.errorMessage}
                </div>
            )}

            {/* Processing Progress Bar (Only for uploaded items) */}
            {item.status === 'completed' && item.batchId && !isFinished && (
                <div className="space-y-1 mt-2">
                    <Progress value={progressPercent} className="h-1.5 bg-yellow-100" indicatorClassName="bg-yellow-500" />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Processing sheets: {processedCount} / {totalSheets} {failedCount > 0 && `(${failedCount} failed)`}</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>
                </div>
            )}
            {/* Finished Status */}
            {isFinished && item.batchId && (
                <div className="mt-2 text-[10px] text-muted-foreground">
                    Processed {processedCount > 0 ? processedCount : totalSheets} sheets. {failedCount > 0 ? `${failedCount} failed.` : 'All successful.'}
                </div>
            )}
        </div>
    );
}
