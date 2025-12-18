'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import { AuditLog, AuditLogParams } from '@/lib/types/audit';
import { auditApi } from '@/lib/api/audit';
import { DataTable } from '@/components/ui/data-table';
import { AuditFilters } from './audit-filters';
import { AuditDetailsDialog } from './audit-details-dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface AuditLogTableProps {
    initialFilters?: Partial<AuditLogParams>;
    showUsernameFilter?: boolean;
}

export function AuditLogTable({ initialFilters = {}, showUsernameFilter }: AuditLogTableProps) {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 20,
    });

    const [filters, setFilters] = useState<AuditLogParams>({
        ...initialFilters,
        size: 20,
    });

    // Query
    const { data, isLoading } = useQuery({
        queryKey: ['audit-logs', pagination.pageIndex, pagination.pageSize, filters],
        queryFn: () => auditApi.getAuditLogs({
            ...filters,
            page: pagination.pageIndex + 1,
            size: pagination.pageSize,
        }),
        placeholderData: keepPreviousData,
    });

    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const handleViewDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setDetailsOpen(true);
    };

    const columns: ColumnDef<AuditLog>[] = [
        {
            accessorKey: 'created_at',
            header: 'Time',
            cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
        },
        {
            accessorKey: 'action',
            header: 'Action',
        },
        {
            accessorKey: 'user.username',
            header: 'User',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.user?.username}</span>
                    <span className="text-xs text-muted-foreground">{row.original.user?.email}</span>
                </div>
            ),
        },
        {
            accessorKey: 'resource_type',
            header: 'Resource',
            cell: ({ row }) => (
                <span className="capitalize">{row.original.resource_type} {row.original.resource_id ? `#${row.original.resource_id}` : ''}</span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(row.original)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <AuditFilters
                filters={filters}
                onFilterChange={setFilters}
                showUsernameFilter={showUsernameFilter}
            />

            <DataTable
                columns={columns}
                data={data?.items || []}
                pageCount={data?.pages || 0}
                pagination={pagination}
                onPaginationChange={setPagination}
                isLoading={isLoading}
            />

            <AuditDetailsDialog
                log={selectedLog}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </div>
    );
}
