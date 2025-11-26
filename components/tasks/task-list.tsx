'use client';

import { Task } from '@/lib/types/tasks';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef, PaginationState, OnChangeFn, RowSelectionState } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface TaskListProps {
    tasks: Task[];
    pageCount: number;
    pagination: PaginationState;
    onPaginationChange: OnChangeFn<PaginationState>;
    rowSelection: RowSelectionState;
    onRowSelectionChange: OnChangeFn<RowSelectionState>;
    isLoading: boolean;
}

// 1. Move helper function outside
const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
        case 'assigned':
            return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
        case 'in_progress':
            return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100';
        case 'complete':
            return 'bg-green-100 text-green-800 hover:bg-green-100';
        case 'graded':
            return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
        case 'exported':
            return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
        default:
            return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
};

// 2. Move columns definition outside so the reference never changes
const columns: ColumnDef<Task>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'task_id',
        header: 'ID',
        cell: ({ row }) => <div className="font-medium">{row.getValue('task_id')}</div>,
    },
    {
        accessorKey: 'exam_center_code',
        header: 'Exam Center',
    },
    {
        id: 'class',
        header: 'Class',
        cell: ({ row }) => {
            const task = row.original;
            return `Level ${task.class_level} / Group ${task.class_group}`;
        },
    },
    {
        accessorKey: 'processing_status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('processing_status') as string;
            return (
                <Badge className={getStatusColor(status)} variant="secondary">
                    {status}
                </Badge>
            );
        },
    },
    {
        id: 'progress',
        header: 'Progress (Reg/Pres/Act)',
        cell: ({ row }) => {
            const task = row.original;
            return `${task.registered_amount} / ${task.present_amount} / ${task.actual_sheet_count}`;
        },
    },
    {
        accessorKey: 'assigned_user_id',
        header: 'Assigned To',
        cell: ({ row }) => row.getValue('assigned_user_id') || '-',
    },
    {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString(),
    },
];

export function TaskList({
    tasks,
    pageCount,
    pagination,
    onPaginationChange,
    rowSelection,
    onRowSelectionChange,
    isLoading,
}: TaskListProps) {
    // 3. The component is now lightweight and only handles data passing
    return (
        <DataTable
            columns={columns}
            data={tasks}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            rowSelection={rowSelection}
            onRowSelectionChange={onRowSelectionChange}
            isLoading={isLoading}
        />
    );
}