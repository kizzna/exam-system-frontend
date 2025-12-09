'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { TaskFilters, TaskFiltersState } from '@/components/tasks/task-filters';
import { TaskList } from '@/components/tasks/task-list';
import { AssignTasksDialog } from '@/components/tasks/assign-tasks-dialog';
import { TaskStatsSummary } from '@/components/tasks/task-stats-summary';
import { TaskStats } from '@/lib/types/tasks';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/providers/auth-provider';
import { Plus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { PaginationState, RowSelectionState, SortingState } from '@tanstack/react-table';

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TaskFiltersState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'error_count',
      desc: true,
    },
  ]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Reset pagination when filters change
  const handleFilterChange = (newFilters: TaskFiltersState) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setRowSelection({});
  };

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters, pagination, sorting],
    queryFn: () =>
      tasksApi.getTasks({
        ...filters,
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
        sort_by: sorting[0]?.id,
        sort_order: sorting[0]?.desc ? 'desc' : 'asc',
      }),
  });

  const tasks = data?.items || [];
  const pageCount = data?.pages || 0;

  // Fetch task stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['tasks-stats', filters],
    queryFn: () => tasksApi.getTaskStats(filters),
  });

  const selectedTaskIds = useMemo(() => {
    // Map row selection to task IDs
    // Since we updated TaskList to use task_id as row ID, the keys in rowSelection are the task IDs.
    return Object.keys(rowSelection).map((id) => parseInt(id));
  }, [rowSelection]);

  const unassignMutation = useMutation({
    mutationFn: tasksApi.unassignTasks,
    onSuccess: () => {
      toast.success('Tasks unassigned successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setRowSelection({});
    },
    onError: (error) => {
      toast.error('Failed to unassign tasks');
      console.error(error);
    },
  });

  const handleUnassign = () => {
    if (!confirm(`Are you sure you want to unassign ${selectedTaskIds.length} tasks?`)) return;
    unassignMutation.mutate(selectedTaskIds);
  };

  // Check if any selected task is assigned
  const hasAssignedTasks = tasks.some(
    (t) => selectedTaskIds.includes(t.task_id) && t.processing_status === 'assigned'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ตรวจข้อสอบ</h1>
        {isAdmin && (
          <div className="flex gap-2">
            {selectedTaskIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleUnassign}
                disabled={!hasAssignedTasks || unassignMutation.isPending}
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Unassign ({selectedTaskIds.length})
              </Button>
            )}
            <Button onClick={() => setIsAssignDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              มอบหมายงาน
            </Button>
          </div>
        )}
      </div>

      <TaskStatsSummary stats={stats} isLoading={isLoadingStats} />

      <TaskFilters filters={filters} onFilterChange={handleFilterChange} />

      <TaskList
        tasks={tasks}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isLoading}
        // Pass current list state params
        listParams={{
          ...filters,
          page: pagination.pageIndex + 1,
          size: pagination.pageSize,
          sort_by: sorting[0]?.id,
          sort_order: sorting[0]?.desc ? 'desc' : 'asc',
        }}
      />

      <AssignTasksDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        filters={filters}
        selectedTaskIds={selectedTaskIds}
      />
    </div>
  );
}
