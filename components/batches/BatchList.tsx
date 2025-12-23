/**
 * BatchList Component
 * Paginated table of batches with filtering
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBatches } from '@/lib/hooks/use-batches';
import { BatchStatusBadge } from './BatchStatusBadge';
import { DeleteBatchButton } from './DeleteBatchButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  const [usernameFilter, setUsernameFilter] = useState('');
  const [batchNameFilter, setBatchNameFilter] = useState('');

  // separate debounced state for API calls to prevent excessive requests
  const [debouncedFilters, setDebouncedFilters] = useState({
    username: '',
    batchName: '',
  });

  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Effect for debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters({
        username: usernameFilter,
        batchName: batchNameFilter,
      });
      if (usernameFilter !== debouncedFilters.username || batchNameFilter !== debouncedFilters.batchName) {
        setPage(1); // Reset to first page when filtering
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [usernameFilter, batchNameFilter]);

  const { data, isLoading, error, refetch } = useBatches({
    status: statusFilter,
    username: debouncedFilters.username || undefined,
    batch_name: debouncedFilters.batchName || undefined,
    page,
    page_size: pageSize,
  });

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-600">กำลังโหลด...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-600">เกิดข้อผิดพลาด: {error.message}</div>
        <Button onClick={() => refetch()} className="mt-4">
          ลองอีกครั้ง
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
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">กรองจากสถานะ:</label>
            <select
              value={statusFilter || ''}
              onChange={(e) => {
                setStatusFilter(e.target.value ? (e.target.value as BatchStatus) : undefined);
                setPage(1); // Reset to first page when filtering
              }}
              className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm max-w-[200px]"
            >
              <option value="">ทั้งหมด</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="failed">ไม่สําเร็จ</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">ชื่อไฟล์:</label>
            <Input
              placeholder="ค้นหาตามชื่อไฟล์..."
              value={batchNameFilter}
              onChange={(e) => setBatchNameFilter(e.target.value)}
              className="w-[200px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">ชื่อผู้ใช้:</label>
            <Input
              placeholder="ค้นหาตามชื่อผู้ใช้..."
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              className="w-[200px]"
            />
          </div>

          <div className="ml-auto text-sm text-gray-600 self-end mb-2">
            จำนวน: {total} รายการ
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {batches.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            {statusFilter || usernameFilter || batchNameFilter
              ? 'ไม่พบข้อมูลอัปโหลดที่ตรงกับเงื่อนไข'
              : 'ไม่พบข้อมูลอัปโหลด'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อไฟล์อัปโหลด</TableHead>
                  <TableHead>วันที่อัปโหลด</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จำนวนใบตอบ</TableHead>
                  <TableHead className="text-right">จำนวนที่ตรวจสำเร็จ</TableHead>
                  <TableHead className="text-right">จำนวนที่ตรวจไม่สำเร็จ</TableHead>
                  {isAdmin && <TableHead>ผู้อัปโหลด</TableHead>}
                  {isAdmin && <TableHead>การดำเนินการ</TableHead>}
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
                        {batch.username || `User ${batch.uploaded_by}`}
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {batch.status === 'failed' && (
                          <DeleteBatchButton
                            batch={batch}
                            isAdmin={isAdmin}
                            onDeleted={() => refetch()}
                          />
                        )}
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
              หน้า {page} จาก {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                หน้าก่อนหน้า
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                หน้าถัดไป
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              แสดง {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} จาก {total}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
