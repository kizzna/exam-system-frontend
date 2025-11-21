/**
 * BatchProgressBar Component
 * Real-time progress monitoring with auto-polling
 */

'use client';

import { useProgressPolling } from '@/lib/hooks/use-batches';
import { BatchStatusBadge } from './BatchStatusBadge';
import { Progress } from '@/components/ui/progress';

interface BatchProgressBarProps {
  batchId: string;
  onComplete?: () => void;
}

export function BatchProgressBar({ batchId, onComplete }: BatchProgressBarProps) {
  const {
    data: progress,
    error,
    isLoading,
  } = useProgressPolling(batchId, {
    enabled: true,
    onComplete: onComplete,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Loading progress...</span>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600">Error loading progress: {error.message}</div>;
  }

  if (!progress) {
    return null;
  }

  const isActive = !['completed', 'failed'].includes(progress.status);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BatchStatusBadge status={progress.status} />
          <span className="text-sm text-gray-600">
            {progress.processed_count} / {progress.sheet_count} sheets processed
          </span>
        </div>
        <span className="text-sm font-medium text-gray-900">
          {Math.round(progress.progress_percentage)}%
        </span>
      </div>

      <Progress value={progress.progress_percentage} className="h-2" />

      {progress.failed_count > 0 && (
        <div className="text-sm text-red-600">
          {progress.failed_count} sheet{progress.failed_count !== 1 ? 's' : ''} failed
        </div>
      )}

      {isActive && (
        <div className="text-xs text-gray-500">Processing... (updates every 2 seconds)</div>
      )}

      {progress.status === 'completed' && progress.completed_at && (
        <div className="text-xs text-green-600">
          Completed at {new Date(progress.completed_at).toLocaleString()}
        </div>
      )}

      {progress.status === 'failed' && (
        <div className="text-xs text-red-600">Processing failed</div>
      )}
    </div>
  );
}
