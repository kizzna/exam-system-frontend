/**
 * DeleteBatchButton Component
 * Admin-only batch deletion with confirmation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeleteBatch } from '@/lib/hooks/use-batches';
import { Button } from '@/components/ui/button';
import type { Batch } from '@/lib/types/batches';

interface DeleteBatchButtonProps {
  batch: Batch;
  isAdmin: boolean;
  onDeleted?: () => void;
  className?: string;
}

export function DeleteBatchButton({
  batch,
  isAdmin,
  onDeleted,
  className = '',
}: DeleteBatchButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const deleteBatch = useDeleteBatch();

  // Hide for non-admin users
  if (!isAdmin) {
    return null;
  }

  const handleDelete = async () => {
    try {
      await deleteBatch.mutateAsync(batch.batch_uuid);

      if (onDeleted) {
        onDeleted();
      } else {
        // Default: redirect to batch list
        router.push('/dashboard/batches');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete batch');
    }
  };

  if (showConfirm) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="text-sm text-gray-700">Delete &quot;{batch.batch_name}&quot;?</div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleteBatch.isPending}
        >
          {deleteBatch.isPending ? 'Deleting...' : 'Confirm'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={deleteBatch.isPending}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowConfirm(true)}
      className={`text-red-600 hover:bg-red-50 hover:text-red-700 ${className}`}
    >
      Delete
    </Button>
  );
}
