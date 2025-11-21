/**
 * BatchList Component
 * Paginated table of batches with filtering
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBatches } from '@/lib/hooks/use-batches';
import { BatchStatusBadge } from './BatchStatusBadge';
import { DeleteBatchButton } from './DeleteBatchButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import type { BatchStatus } from '@/lib/types/batches';

interface BatchListProps {
  isAdmin?: boolean;
}

export function BatchList({ isAdmin = false }: BatchListProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<BatchStatus | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading, error, refetch } = useBatches({
    status: statusFilter,
    page,
    page_size: pageSize,
  });

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-600">Loading batches...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-600">Error loading batches: {error.message}</div>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </Card>
    );
  }

  const batches = data?.batches || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filter by status:</label>
          <select
            value={statusFilter || ''}
            onChange={(e) => {
              setStatusFilter(e.target.value ? (e.target.value as BatchStatus) : undefined);
              setPage(1); // Reset to first page when filtering
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="uploaded">Uploaded</option>
            <option value="validating">Validating</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="reprocessing">Reprocessing</option>
          </select>

          <div className="ml-auto text-sm text-gray-600">
            Total: {total} batch{total !== 1 ? 'es' : ''}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {batches.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            {statusFilter
              ? `No batches with status "${statusFilter}"`
              : 'No batches found. Upload your first batch to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sheets</TableHead>
                  <TableHead className="text-right">Processed</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  {isAdmin && <TableHead>Uploaded By</TableHead>}
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow
                    key={batch.batch_uuid}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/dashboard/batches/${batch.batch_uuid}`)}
                  >
                    <TableCell className="font-medium">{batch.batch_name}</TableCell>
                    <TableCell>{new Date(batch.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <BatchStatusBadge status={batch.status} />
                    </TableCell>
                    <TableCell className="text-right">{batch.sheet_count}</TableCell>
                    <TableCell className="text-right">{batch.processed_count}</TableCell>
                    <TableCell className="text-right">
                      <span className={batch.failed_count > 0 ? 'font-medium text-red-600' : ''}>
                        {batch.failed_count}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {batch.uploaded_by_username || `User ${batch.uploaded_by}`}
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DeleteBatchButton
                          batch={batch}
                          isAdmin={isAdmin}
                          onDeleted={() => refetch()}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
