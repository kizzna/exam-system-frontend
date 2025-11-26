'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { TaskFilters, TaskFiltersState } from '@/components/tasks/task-filters';
import { TaskList } from '@/components/tasks/task-list';
import { AssignTasksDialog } from '@/components/tasks/assign-tasks-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/providers/auth-provider';
import { Plus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { PaginationState, RowSelectionState } from '@tanstack/react-table';

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TaskFiltersState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Reset pagination when filters change
  const handleFilterChange = (newFilters: TaskFiltersState) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setRowSelection({});
  };

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters, pagination],
    queryFn: () =>
      tasksApi.getTasks({
        ...filters,
        page: pagination.pageIndex + 1,
        size: pagination.pageSize,
      }),
  });

  const tasks = data?.items || [];
  const pageCount = data?.pages || 0;

  const selectedTaskIds = useMemo(() => {
    // Map row selection to task IDs
    // Note: This only works for currently visible tasks if we rely on row index
    // But since we need IDs for actions, we need a way to track selected IDs across pages if desired.
    // For now, we'll stick to current page selection or need to map selection state differently.
    // TanStack table row selection uses row ID (default index). We should use task ID as row ID.
    // However, TaskList implementation of DataTable uses default getRowId.
    // We need to update TaskList to pass getRowId or handle selection mapping.
    // Let's assume for now we only select from current page.
    // Actually, we can just map the selection indices to tasks if we use index.
    // Better: Let's update TaskList/DataTable to use task ID as row key if possible,
    // or just map current page tasks.
    return Object.keys(rowSelection)
      .map((index) => tasks[parseInt(index)]?.id)
      .filter((id) => id !== undefined);
  }, [rowSelection, tasks]);

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
    (t) => selectedTaskIds.includes(t.id) && t.processing_status === 'assigned'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tasks</h1>
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
              Assign Tasks
            </Button>
          </div>
        )}
      </div>

      <TaskFilters filters={filters} onFilterChange={handleFilterChange} />

      <TaskList
        tasks={tasks}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        isLoading={isLoading}
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
