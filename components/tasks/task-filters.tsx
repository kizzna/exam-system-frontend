'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { useQuery } from '@tanstack/react-query';
import { masterDataApi } from '@/lib/api/master-data';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export interface TaskFiltersState {
    eval_center_id?: number;
    processing_status?: string;
    class_level?: number;
    exam_center_code?: number;
}

interface TaskFiltersProps {
    filters: TaskFiltersState;
    onFilterChange: (filters: TaskFiltersState) => void;
}

export function TaskFilters({ filters, onFilterChange }: TaskFiltersProps) {
    const { user, isAdmin } = useAuth();

    // Fetch evaluation centers
    const { data: evalCenters } = useQuery({
        queryKey: ['evaluation-centers'],
        queryFn: masterDataApi.getEvaluationCenters,
    });

    // Determine user scopes
    const evalCenterScope = user?.scopes?.find((s) => s.scope_type === 'eval_center');
    const lockedEvalCenterId = evalCenterScope?.scope_id;
    const allowedClassLevels = evalCenterScope?.filters?.class_levels;

    // Apply scope locks on mount or when user changes
    useEffect(() => {
        if (lockedEvalCenterId && filters.eval_center_id !== lockedEvalCenterId) {
            onFilterChange({ ...filters, eval_center_id: lockedEvalCenterId });
        }
    }, [lockedEvalCenterId, filters, onFilterChange]);

    const handleEvalCenterChange = (value: string) => {
        onFilterChange({ ...filters, eval_center_id: value === 'all' ? undefined : parseInt(value) });
    };

    const handleStatusChange = (value: string) => {
        onFilterChange({ ...filters, processing_status: value === 'all' ? undefined : value });
    };

    const handleClassLevelChange = (level: number, checked: boolean) => {
        // Since API currently supports single class_level, we treat this as a radio or single selection for now,
        // or if we want multiple, we need to update API. Guide says "Class Level: Checkboxes", but API `class_level` (int, optional).
        // If it's single selection, checkboxes might be confusing, but maybe it filters by one.
        // Let's implement as single selection for now to match API type, or toggle.
        if (checked) {
            onFilterChange({ ...filters, class_level: level });
        } else {
            if (filters.class_level === level) {
                onFilterChange({ ...filters, class_level: undefined });
            }
        }
    };

    return (
        <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-3">
            <div className="space-y-2">
                <Label htmlFor="eval-center">Evaluation Center</Label>
                <Select
                    value={filters.eval_center_id?.toString() || 'all'}
                    onValueChange={handleEvalCenterChange}
                    disabled={!!lockedEvalCenterId}
                >
                    <SelectTrigger id="eval-center">
                        <SelectValue placeholder="Select Evaluation Center" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Centers</SelectItem>
                        {evalCenters?.map((center) => (
                            <SelectItem key={center.id} value={center.id.toString()}>
                                {center.name} ({center.code})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                    value={filters.processing_status || 'all'}
                    onValueChange={handleStatusChange}
                >
                    <SelectTrigger id="status">
                        <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="graded">Graded</SelectItem>
                        <SelectItem value="exported">Exported</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Class</Label>
                <div className="flex flex-wrap gap-4 pt-2">
                    {[1, 2, 3].map((level) => {
                        const isAllowed = !allowedClassLevels || allowedClassLevels.includes(level);
                        if (!isAllowed) return null;

                        return (
                            <div key={level} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`class-${level}`}
                                    checked={filters.class_level === level}
                                    onCheckedChange={(checked) => handleClassLevelChange(level, checked as boolean)}
                                />
                                <Label htmlFor={`class-${level}`} className="text-sm font-normal">
                                    Class {level}
                                </Label>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
