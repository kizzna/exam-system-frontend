'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { usersApi } from '@/lib/api/users';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskFiltersState } from './task-filters';
import { TaskAssignmentRequest } from '@/lib/types/tasks';

interface AssignTasksDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: TaskFiltersState;
    selectedTaskIds: number[];
}

export function AssignTasksDialog({ open, onOpenChange, filters, selectedTaskIds }: AssignTasksDialogProps) {
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [scope, setScope] = useState<'selected' | 'filter'>('filter');
    const [permission, setPermission] = useState<'view' | 'upload' | 'manage'>('upload');

    // Fetch users (simple implementation: fetch first 50 active users)
    const { data: usersData } = useQuery({
        queryKey: ['users-list'],
        queryFn: () => usersApi.getUsers({ page: 1, page_size: 50, is_active: true }),
        enabled: open,
    });

    const assignMutation = useMutation({
        mutationFn: tasksApi.assignTasks,
        onSuccess: () => {
            onOpenChange(false);
            alert('Tasks assigned successfully');
        },
        onError: (error) => {
            alert('Failed to assign tasks: ' + error);
        },
    });

    const handleAssign = () => {
        if (!selectedUserId) return;

        const request: TaskAssignmentRequest = {
            user_id: parseInt(selectedUserId),
            permission_level: permission,
        };

        if (scope === 'selected') {
            if (selectedTaskIds.length === 0) {
                alert('No tasks selected');
                return;
            }
            request.task_ids = selectedTaskIds;
        } else {
            // Apply filters
            request.eval_center_id = filters.eval_center_id;
            request.class_level = filters.class_level;
            // Note: API might need to support other filters in assignment if needed, 
            // but guide only mentions eval_center_id and class_level in example.
            // We'll pass what we have that matches the type.
        }

        assignMutation.mutate(request);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Tasks</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="user">Assign To</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger id="user">
                                <SelectValue placeholder="Select User" />
                            </SelectTrigger>
                            <SelectContent>
                                {usersData?.users.map((user) => (
                                    <SelectItem key={user.user_id} value={user.user_id.toString()}>
                                        {user.full_name} ({user.username})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Scope</Label>
                        <RadioGroup value={scope} onValueChange={(v) => setScope(v as 'selected' | 'filter')}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="selected" id="scope-selected" disabled={selectedTaskIds.length === 0} />
                                <Label htmlFor="scope-selected">Selected Tasks ({selectedTaskIds.length})</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="filter" id="scope-filter" />
                                <Label htmlFor="scope-filter">All Tasks in Current Filter</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label>Permission Level</Label>
                        <RadioGroup value={permission} onValueChange={(v) => setPermission(v as 'view' | 'upload' | 'manage')}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="view" id="perm-view" />
                                <Label htmlFor="perm-view">View Only</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="upload" id="perm-upload" />
                                <Label htmlFor="perm-upload">Upload</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="manage" id="perm-manage" />
                                <Label htmlFor="perm-manage">Manage</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={!selectedUserId || assignMutation.isPending}>
                        {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
