/**
 * BatchStatusBadge Component
 * Visual status indicator with color coding
 */

'use client';

import { type BatchStatus } from '@/lib/types/batches';

interface BatchStatusBadgeProps {
  status: BatchStatus;
  className?: string;
}

const statusConfig: Record<BatchStatus, { label: string; className: string }> = {
  uploaded: {
    label: 'Uploaded',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  validating: {
    label: 'Validating',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  processing: {
    label: 'Processing',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  reprocessing: {
    label: 'Reprocessing',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
};

export function BatchStatusBadge({ status, className = '' }: BatchStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
