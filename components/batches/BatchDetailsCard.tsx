/**
 * BatchDetailsCard Component
 * Detailed batch information display
 */

'use client';

import React from 'react';
import { useBatchStatus } from '@/lib/hooks/use-batches';
import { BatchStatusBadge } from './BatchStatusBadge';
import { BatchProgressStream } from './BatchProgressStream';
import { DeleteBatchButton } from './DeleteBatchButton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface BatchDetailsCardProps {
  batchId: string;
  isAdmin?: boolean;
}

export function BatchDetailsCard({ batchId, isAdmin = false }: BatchDetailsCardProps) {
  const { data: batch, isLoading, error, refetch } = useBatchStatus(batchId, false);
  const [isRecovering, setIsRecovering] = React.useState(false);
  const [recoveryMessage, setRecoveryMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Debug logging
  console.log('[BatchDetailsCard] Rendering with:', {
    batchId,
    batch: batch
      ? {
          batch_id: batch.batch_id,
          status: batch.status,
          total_sheets: batch.total_sheets,
          processed_sheets: batch.processed_sheets,
        }
      : undefined,
    isLoading,
    error,
  });

  const handleRecover = async () => {
    setIsRecovering(true);
    setRecoveryMessage(null);

    try {
      const { recoverBatch } = await import('@/lib/api/batches');
      const result = await recoverBatch(batchId);

      if (result.success && result.sheets_recovered > 0) {
        setRecoveryMessage({
          type: 'success',
          text: `Recovery successful! Saved ${result.sheets_recovered.toLocaleString()} sheets and ${result.answers_recovered.toLocaleString()} answers.`,
        });
        // Refresh batch data to show updated status
        setTimeout(() => refetch(), 1000);
      } else {
        setRecoveryMessage({
          type: 'error',
          text: result.message || 'No data found to recover.',
        });
      }
    } catch (err) {
      setRecoveryMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to trigger recovery.',
      });
    } finally {
      setIsRecovering(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-600">Loading batch details...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="mb-4 text-red-600">Error loading batch: {error.message}</div>
        <Button onClick={() => refetch()}>Retry</Button>
      </Card>
    );
  }

  if (!batch) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-600">Batch not found</div>
        <Link href="/dashboard/batches">
          <Button className="mt-4">Back to Batches</Button>
        </Link>
      </Card>
    );
  }

  const isActive = !['completed', 'failed'].includes(batch.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Batch Processing</h2>
            <div className="text-sm text-gray-600">
              Batch ID: <span className="font-mono">{batch.batch_id}</span>
            </div>
          </div>
          <BatchStatusBadge status={batch.status} />
        </div>
      </Card>

      {/* Progress (SSE-based real-time streaming) - Only for active batches */}
      {!['completed', 'failed'].includes(batch.status) && (
        <BatchProgressStream batchId={batchId} onComplete={() => refetch()} />
      )}

      {/* Batch Information */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold">Batch Information</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-600">Upload Date</dt>
            <dd className="font-medium">{new Date(batch.created_at).toLocaleString()}</dd>
          </div>

          {batch.processing_completed_at && (
            <div>
              <dt className="text-sm text-gray-600">Completion Date</dt>
              <dd className="font-medium">
                {new Date(batch.processing_completed_at).toLocaleString()}
              </dd>
            </div>
          )}

          <div>
            <dt className="text-sm text-gray-600">Total Sheets</dt>
            <dd className="text-lg font-medium">{batch.total_sheets.toLocaleString()}</dd>
          </div>

          <div>
            <dt className="text-sm text-gray-600">Processed</dt>
            <dd className="text-lg font-medium text-green-600">
              {batch.processed_sheets.toLocaleString()}
            </dd>
          </div>

          {batch.failed_sheets > 0 && (
            <div>
              <dt className="text-sm text-gray-600">Failed</dt>
              <dd className="text-lg font-medium text-red-600">
                {batch.failed_sheets.toLocaleString()}
              </dd>
            </div>
          )}

          {batch.processing_started_at && batch.processing_completed_at && (
            <>
              <div>
                <dt className="text-sm text-gray-600">Total Processing Time</dt>
                <dd className="font-medium text-blue-600">
                  {(() => {
                    const upload = new Date(batch.created_at).getTime();
                    const complete = new Date(batch.processing_completed_at).getTime();
                    const durationMs = complete - upload;
                    const minutes = Math.floor(durationMs / 60000);
                    const seconds = Math.floor((durationMs % 60000) / 1000);
                    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                  })()}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-600">Extraction Time</dt>
                <dd className="font-medium text-gray-600">
                  {(() => {
                    const upload = new Date(batch.created_at).getTime();
                    const start = new Date(batch.processing_started_at).getTime();
                    const durationMs = start - upload;
                    const minutes = Math.floor(durationMs / 60000);
                    const seconds = Math.floor((durationMs % 60000) / 1000);
                    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                  })()}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-600">OMR Processing Time</dt>
                <dd className="font-medium text-green-600">
                  {(() => {
                    const start = new Date(batch.processing_started_at).getTime();
                    const end = new Date(batch.processing_completed_at).getTime();
                    const durationMs = end - start;
                    const minutes = Math.floor(durationMs / 60000);
                    const seconds = Math.floor((durationMs % 60000) / 1000);
                    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                  })()}
                </dd>
              </div>
            </>
          )}
        </dl>
      </Card>

      {/* Error Message */}
      {batch.error_message && (
        <Card className="border-red-200 bg-red-50 p-6">
          <h3 className="mb-2 font-semibold text-red-900">Error</h3>
          <p className="text-sm text-red-700">{batch.error_message}</p>
        </Card>
      )}

      {/* Processing Timeline */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold">Processing Timeline</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-2 h-2 w-2 rounded-full bg-blue-600" />
            <div className="flex-1">
              <div className="font-medium">Uploaded</div>
              <div className="text-sm text-gray-600">
                {new Date(batch.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {batch.status !== 'uploaded' && (
            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-purple-600" />
              <div className="flex-1">
                <div className="font-medium">Processing Started</div>
                <div className="text-sm text-gray-600">
                  {batch.processing_started_at
                    ? new Date(batch.processing_started_at).toLocaleString()
                    : 'In progress'}
                </div>
              </div>
            </div>
          )}

          {batch.status === 'completed' && batch.processing_completed_at && (
            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-green-600" />
              <div className="flex-1">
                <div className="font-medium">Completed</div>
                <div className="text-sm text-gray-600">
                  {new Date(batch.processing_completed_at).toLocaleString()}
                </div>
                <div className="text-sm font-medium text-green-600">
                  All {batch.total_sheets.toLocaleString()} sheets processed successfully
                </div>
                {batch.processing_started_at && (
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="text-gray-600">
                      <span className="font-medium">Extraction:</span>{' '}
                      {(() => {
                        const upload = new Date(batch.created_at).getTime();
                        const start = new Date(batch.processing_started_at).getTime();
                        const durationMs = start - upload;
                        const minutes = Math.floor(durationMs / 60000);
                        const seconds = Math.floor((durationMs % 60000) / 1000);
                        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                      })()}
                    </div>
                    <div className="text-green-600">
                      <span className="font-medium">OMR Processing:</span>{' '}
                      {(() => {
                        const start = new Date(batch.processing_started_at).getTime();
                        const end = new Date(batch.processing_completed_at).getTime();
                        const durationMs = end - start;
                        const minutes = Math.floor(durationMs / 60000);
                        const seconds = Math.floor((durationMs % 60000) / 1000);
                        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                      })()}
                    </div>
                    <div className="text-blue-600">
                      <span className="font-medium">Total:</span>{' '}
                      {(() => {
                        const upload = new Date(batch.created_at).getTime();
                        const complete = new Date(batch.processing_completed_at).getTime();
                        const durationMs = complete - upload;
                        const minutes = Math.floor(durationMs / 60000);
                        const seconds = Math.floor((durationMs % 60000) / 1000);
                        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {batch.status === 'failed' && (
            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-red-600" />
              <div className="flex-1">
                <div className="font-medium">Failed</div>
                <div className="text-sm text-red-600">
                  {batch.error_message || 'Processing failed'}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recovery Message */}
      {recoveryMessage && (
        <Card
          className={`p-6 ${
            recoveryMessage.type === 'success'
              ? 'border-green-200 bg-green-50'
              : 'border-yellow-200 bg-yellow-50'
          }`}
        >
          <div
            className={`text-sm ${
              recoveryMessage.type === 'success' ? 'text-green-800' : 'text-yellow-800'
            }`}
          >
            {recoveryMessage.text}
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/batches">
            <Button variant="outline">Back to Batches</Button>
          </Link>

          {/* Recovery Button - Only shown for failed batches */}
          {batch.status === 'failed' && (
            <Button
              onClick={handleRecover}
              disabled={isRecovering}
              className="bg-blue-600 hover:bg-blue-700"
              title="Attempt to recover processed results from temporary storage"
            >
              {isRecovering ? 'Recovering...' : 'Recover Results'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
