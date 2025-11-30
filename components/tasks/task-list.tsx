'use client';

import { Task } from '@/lib/types/tasks';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef, PaginationState, OnChangeFn, RowSelectionState, SortingState } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SearchCheck } from 'lucide-react';

interface TaskListProps {
    tasks: Task[];
    pageCount: number;
    pagination: PaginationState;
    onPaginationChange: OnChangeFn<PaginationState>;
    rowSelection: RowSelectionState;
    onRowSelectionChange: OnChangeFn<RowSelectionState>;
    sorting: SortingState;
    onSortingChange: OnChangeFn<SortingState>;
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
        enableSorting: true,
        enableHiding: true,
    },
    // {
    //     accessorKey: 'task_id',
    //     header: 'Task ID',
    //     cell: ({ row }) => <div className="font-medium">{row.getValue('task_id')}</div>,
    // },
    {
        accessorKey: 'exam_center_code',
        header: 'รหัสสนาม',
        enableSorting: true,
    },
    {
        id: 'class',
        header: 'ชั้น',
        cell: ({ row }) => {
            const task = row.original;
            const level_id = task.class_level;
            // map level_id to thai name: 1 -> ตรี, 2 -> โท, 3 -> เอก
            const level_name = level_id === 1 ? 'ตรี' : level_id === 2 ? 'โท' : level_id === 3 ? 'เอก' : '';
            return level_name;
        },
    },
    {
        id: 'group',
        header: 'ช่วงชั้น',
        cell: ({ row }) => {
            const task = row.original;
            const group_id = task.class_group;
            // map group_id to thai name: 1 -> ประถม, 2 -> มัธยม, 3 -> อุดม
            const group_name = group_id === 1 ? 'ประถม' : group_id === 2 ? 'มัธยม' : group_id === 3 ? 'อุดม' : '';
            return group_name;
        },
    },
    {
        accessorKey: 'processing_status',
        header: 'สถานะ',
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
        header: 'ส่ง/คง/สแกน',
        cell: ({ row }) => {
            const task = row.original;
            return `${task.registered_amount} / ${task.present_amount} / ${task.actual_sheet_count}`;
        },
    },
    {
        accessorKey: 'assigned_user_id',
        header: 'ผู้รับผิดชอบ',
        cell: ({ row }) => row.getValue('assigned_user_id') || '-',
    },
    // {
    //     accessorKey: 'created_at',
    //     header: 'สร้างเมื่อ',
    //     cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString(),
    // },
    // {
    //     accessorKey: 'latest_batch_id',
    //     header: 'Batch ID',
    //     cell: ({ row }) => {
    //         const id = row.getValue('latest_batch_id');
    //         return id ? <div className="font-mono text-xs">{id as string}</div> : '-';
    //     },
    // },
    {
        id: 'review',
        header: 'ตรวจ',
        cell: ({ row }) => (
            <Button variant="outline" size="sm" className="h-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                <Link href={`/dashboard/tasks/${row.original.task_id}/review`}>
                    <SearchCheck className="mr-2 h-4 w-4" />
                    ตรวจ
                </Link>
            </Button>
        ),
    },
    {
        accessorKey: 'error_count',
        header: 'ปัญหา',
        enableSorting: true,
        cell: ({ row }) => {
            const count = row.getValue('error_count') as number;
            return count > 0 ? <Badge variant="destructive" className="rounded-full">{count}</Badge> : '-';
        },
    },
    {
        accessorKey: 'err_duplicate_sheets_count',
        header: 'ซ้ำ',
        enableSorting: true,
        cell: ({ row }) => {
            const count = row.original.err_duplicate_sheets_count || 0;
            return count > 0 ? <Badge className="bg-orange-500 hover:bg-orange-600 rounded-full">{count}</Badge> : null;
        },
    },
    {
        accessorKey: 'err_low_answer_count',
        header: '< 141',
        enableSorting: true,
        cell: ({ row }) => {
            const count = row.original.err_low_answer_count || 0;
            return count > 0 ? <Badge className="bg-yellow-500 hover:bg-yellow-600 rounded-full">{count}</Badge> : null;
        },
    },
    {
        accessorKey: 'err_student_id_count',
        header: 'เลขที่ผิด',
        enableSorting: true,
        cell: ({ row }) => {
            const count = row.original.err_student_id_count || 0;
            return count > 0 ? <Badge variant="destructive" className="rounded-full">{count}</Badge> : null;
        },
    },
    {
        accessorKey: 'err_exam_center_id_count',
        header: 'รหัสสนามผิด',
        enableSorting: true,
        cell: ({ row }) => {
            const count = row.original.err_exam_center_id_count || 0;
            return count > 0 ? <Badge className="bg-purple-500 hover:bg-purple-600 rounded-full">{count}</Badge> : null;
        },
    },
    {
        accessorKey: 'err_class_level_count',
        header: 'ชั้นผิด',
        enableSorting: true,
        cell: ({ row }) => {
            const count = row.original.err_class_level_count || 0;
            return count > 0 ? <Badge className="bg-blue-500 hover:bg-blue-600 rounded-full">{count}</Badge> : null;
        },
    },
    {
        accessorKey: 'err_class_group_count',
        header: 'ช่วงชั้นผิด',
        enableSorting: true,
        cell: ({ row }) => {
            const count = row.original.err_class_group_count || 0;
            return count > 0 ? <Badge className="bg-stone-500 hover:bg-stone-600 rounded-full">{count}</Badge> : null;
        },
    },
];

export function TaskList({
    tasks,
    pageCount,
    pagination,
    onPaginationChange,
    rowSelection,
    onRowSelectionChange,
    sorting,
    onSortingChange,
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
            sorting={sorting}
            onSortingChange={onSortingChange}
            isLoading={isLoading}
            getRowId={(row) => row.task_id.toString()}
        />
    );
}