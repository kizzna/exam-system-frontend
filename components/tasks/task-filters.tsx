'use client';
import { useEffect } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { useQuery, useMutation } from '@tanstack/react-query';
import { masterDataApi } from '@/lib/api/master-data';
import { tasksApi } from '@/lib/api/tasks';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Filter, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface TaskFiltersState {
    eval_center_id?: number;
    processing_status?: string;
    class_level?: number;
    exam_center_code?: number;
    latest_batch_id?: number;
    task_id?: string;
    class_group?: number;
    error_count?: number;
    err_duplicate_sheets_count?: number;
    err_low_answer_count?: number;
    err_student_id_count?: number;
    err_exam_center_id_count?: number;
    err_class_group_count?: number;
    err_class_level_count?: number;
    err_absent_count?: number;
    missing_sheet_count?: number;
    excessive_sheet_count?: number;
    empty_task?: boolean;
    registered_amount?: number;
    present_amount?: number;
    actual_sheet_count?: number;
    trash_count?: number;
}

interface TaskFiltersProps {
    filters: TaskFiltersState;
    onFilterChange: (filters: TaskFiltersState) => void;
    onRefresh?: () => void;
    selectedTaskIds?: number[];
}

export function TaskFilters({ filters, onFilterChange, onRefresh, selectedTaskIds = [] }: TaskFiltersProps) {
    const { user, isAdmin } = useAuth();

    // Fetch evaluation centers
    const { data: evalCenters } = useQuery({
        queryKey: ['evaluation-centers'],
        queryFn: masterDataApi.getEvaluationCenters,
    });

    // Mutations
    const recalculateBatchMutation = useMutation({
        mutationFn: tasksApi.recalculateBatch,
        onSuccess: (data) => {
            toast.success(`คำนวณสถิติใหม่สำเร็จ: ${data.tasks_recalculated} งาน.`);
            onRefresh?.();
        },
        onError: (error) => {
            toast.error('คำนวณสถิติใหม่ไม่สำเร็จ');
            console.error(error);
        },
    });

    const recalculateTasksMutation = useMutation({
        mutationFn: tasksApi.recalculateTaskStatistics,
        onSuccess: (data) => {
            toast.success(`คำนวณสถิติใหม่สำเร็จ: ${data.tasks_recalculated} งาน.`);
            onRefresh?.();
        },
        onError: (error) => {
            toast.error('คำนวณสถิติใหม่ไม่สำเร็จ');
            console.error(error);
        },
    });

    const handleRecalculateBatch = () => {
        if (!filters.eval_center_id) return;
        if (!confirm('ต้องการคำนวณสถิติใหม่สำหรับงานกองที่เลือกไว้?')) return;
        recalculateBatchMutation.mutate(filters.eval_center_id);
    };

    const handleRecalculateTasks = () => {
        if (selectedTaskIds.length === 0) return;
        if (!confirm(`ต้องการคำนวณสถิติใหม่สำหรับ ${selectedTaskIds.length} งานที่เลือกไว้?`)) return;
        recalculateTasksMutation.mutate(selectedTaskIds);
    };

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

    const handleClassGroupChange = (value: string) => {
        onFilterChange({ ...filters, class_group: value === 'all' ? undefined : parseInt(value) });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onFilterChange({ ...filters });
            onRefresh?.();
        }
    };

    return (
        <div className="grid gap-4 rounded-lg border p-4">
            {/* Row 1: Evaluation Center, Task ID, Class Level, Class Group, Status */}
            <div className="grid gap-4 md:grid-cols-12">
                <div className="space-y-2 col-span-12 md:col-span-4">
                    <Label htmlFor="eval-center">กองงานตรวจใบตอบ</Label>
                    <div className="flex gap-2">
                        <Select
                            value={filters.eval_center_id?.toString() || 'all'}
                            onValueChange={handleEvalCenterChange}
                            disabled={!!lockedEvalCenterId}
                        >
                            <SelectTrigger id="eval-center">
                                <SelectValue placeholder="เลือกกองงาน" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทั้งหมด</SelectItem>
                                {evalCenters?.map((center) => (
                                    <SelectItem key={center.id} value={center.id.toString()}>
                                        {center.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {isAdmin && filters.eval_center_id && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleRecalculateBatch}
                                disabled={recalculateBatchMutation.isPending}
                                title="คำนวณสถิติใหม่ (กองงาน)"
                            >
                                {recalculateBatchMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Calculator className="h-4 w-4" />
                                )}
                            </Button>
                        )}
                    </div>
                </div>



                <div className="space-y-2 col-span-12 md:col-span-2">
                    <Label htmlFor="class-level">ชั้น</Label>
                    <Select
                        value={filters.class_level?.toString() || 'all'}
                        onValueChange={(val) => onFilterChange({ ...filters, class_level: val === 'all' ? undefined : parseInt(val) })}
                    >
                        <SelectTrigger id="class-level">
                            <SelectValue placeholder="ทุกชั้น" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทุกชั้น</SelectItem>
                            <SelectItem value="1">ตรี</SelectItem>
                            <SelectItem value="2">โท</SelectItem>
                            <SelectItem value="3">เอก</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 col-span-12 md:col-span-2">
                    <Label htmlFor="class-group">ช่วงชั้น</Label>
                    <Select
                        value={filters.class_group?.toString() || 'all'}
                        onValueChange={handleClassGroupChange}
                    >
                        <SelectTrigger id="class-group">
                            <SelectValue placeholder="ทุกช่วงชั้น" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทุกช่วงชั้น</SelectItem>
                            <SelectItem value="1">ประถม</SelectItem>
                            <SelectItem value="2">มัธยม</SelectItem>
                            <SelectItem value="3">อุดม</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 col-span-12 md:col-span-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={filters.processing_status || 'all'}
                        onValueChange={handleStatusChange}
                    >
                        <SelectTrigger id="status" className="w-full">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            <SelectItem value="pending">กำลังตรวจ</SelectItem>
                            {/* <SelectItem value="assigned">กำลังตรวจ</SelectItem> */}
                            <SelectItem value="complete">ตรวจเสร็จแล้ว</SelectItem>
                            {/* <SelectItem value="graded">Graded</SelectItem>
                            <SelectItem value="exported">Exported</SelectItem> */}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Row 2: Min Error Count */}
            <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2 w-40">
                    <Label htmlFor="task-id">รหัสสนาม</Label>
                    <Input
                        id="task-id"
                        placeholder="ค้นหา..."
                        value={filters.task_id || ''}
                        onChange={(e) => onFilterChange({ ...filters, task_id: e.target.value || undefined })}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="space-y-2 w-40">
                    <Label htmlFor="error-count">มีปัญหา</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="error-count"
                            type="number"
                            placeholder="> 0"
                            value={filters.error_count || ''}
                            onChange={(e) => onFilterChange({ ...filters, error_count: e.target.value ? parseInt(e.target.value) : undefined })}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="empty-task"
                                checked={!!filters.empty_task}
                                onCheckedChange={(checked) => onFilterChange({ ...filters, empty_task: checked ? true : undefined })}
                            />
                            <Label htmlFor="empty-task" className="text-xs whitespace-nowrap">ไม่มีใบตอบ</Label>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 w-28">
                    <Label htmlFor="err-dup" className="text-xs">ซ้ำ</Label>
                    <Input
                        id="err-dup"
                        type="number"
                        placeholder="> 0"
                        value={filters.err_duplicate_sheets_count || ''}
                        onChange={(e) => onFilterChange({ ...filters, err_duplicate_sheets_count: e.target.value ? parseInt(e.target.value) : undefined })}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="space-y-2 w-28">
                    <Label htmlFor="err-low" className="text-xs">&lt; 141 ข้อ</Label>
                    <Input
                        id="err-low"
                        type="number"
                        placeholder="> 0"
                        value={filters.err_low_answer_count || ''}
                        onChange={(e) => onFilterChange({ ...filters, err_low_answer_count: e.target.value ? parseInt(e.target.value) : undefined })}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="space-y-2 w-28">
                    <Label htmlFor="err-sid" className="text-xs">เลขที่สอบผิด</Label>
                    <Input
                        id="err-sid"
                        type="number"
                        placeholder="> 0"
                        value={filters.err_student_id_count || ''}
                        onChange={(e) => onFilterChange({ ...filters, err_student_id_count: e.target.value ? parseInt(e.target.value) : undefined })}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="space-y-2 w-28">
                    <Label htmlFor="err-absent" className="text-xs">ขาดสอบมีใบตอบ</Label>
                    <Input
                        id="err-absent"
                        type="number"
                        placeholder="> 0"
                        value={filters.err_absent_count || ''}
                        onChange={(e) => onFilterChange({ ...filters, err_absent_count: e.target.value ? parseInt(e.target.value) : undefined })}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="space-y-2 w-28">
                    <Label htmlFor="missing-sheet" className="text-xs">ใบตอบขาด</Label>
                    <Input
                        id="missing-sheet"
                        type="number"
                        placeholder="> 0"
                        value={filters.missing_sheet_count || ''}
                        onChange={(e) => onFilterChange({ ...filters, missing_sheet_count: e.target.value ? parseInt(e.target.value) : undefined })}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="space-y-2 w-28">
                    <Label htmlFor="excessive-sheet" className="text-xs">ใบตอบเกิน</Label>
                    <Input
                        id="excessive-sheet"
                        type="number"
                        placeholder="> 0"
                        value={filters.excessive_sheet_count || ''}
                        onChange={(e) => onFilterChange({ ...filters, excessive_sheet_count: e.target.value ? parseInt(e.target.value) : undefined })}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="space-y-2 w-28">
                    <Label htmlFor="act-sheet" className="text-xs">จำนวนสแกน</Label>
                    <Input
                        id="act-sheet"
                        type="number"
                        placeholder=">= ..."
                        value={filters.actual_sheet_count || ''}
                        onChange={(e) => onFilterChange({ ...filters, actual_sheet_count: e.target.value ? parseInt(e.target.value) : undefined })}
                        onKeyDown={handleKeyDown}
                    />
                </div>


                <div className="flex items-end gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline">
                                <Filter className="mr-2 h-4 w-4" />
                                ตัวกรองอื่นๆ
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4">
                            <div className="grid gap-4">
                                {/* Specific Errors */}
                                <div className="grid grid-cols-2 gap-2">

                                    {/* This error is not used anymore but keep it for future use */}
                                    {/* <div className="space-y-1">
                                        <Label htmlFor="err-center" className="text-xs">รหัสสนามสอบผิด</Label>
                                        <Input
                                            id="err-center"
                                            type="number"
                                            className="h-8"
                                            placeholder="> 0"
                                            value={filters.err_exam_center_id_count || ''}
                                            onChange={(e) => onFilterChange({ ...filters, err_exam_center_id_count: e.target.value ? parseInt(e.target.value) : undefined })}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div> */}
                                    {/* This error is not used anymore but keep it for future use */}
                                    {/* <div className="space-y-1">
                                        <Label htmlFor="err-grp" className="text-xs">ช่วงชั้นผิด</Label>
                                        <Input
                                            id="err-grp"
                                            type="number"
                                            className="h-8"
                                            placeholder="> 0"
                                            value={filters.err_class_group_count || ''}
                                            onChange={(e) => onFilterChange({ ...filters, err_class_group_count: e.target.value ? parseInt(e.target.value) : undefined })}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div> */}
                                    {/* This error is not used anymore but keep it for future use */}
                                    {/* <div className="space-y-1">
                                        <Label htmlFor="err-lvl" className="text-xs">ชั้นผิด</Label>
                                        <Input
                                            id="err-lvl"
                                            type="number"
                                            className="h-8"
                                            placeholder="> 0"
                                            value={filters.err_class_level_count || ''}
                                            onChange={(e) => onFilterChange({ ...filters, err_class_level_count: e.target.value ? parseInt(e.target.value) : undefined })}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div> */}
                                    <div className="col-span-2 border-t my-2"></div>
                                    <div className="space-y-1">
                                        <Label htmlFor="reg-amt" className="text-xs">จำนวนสมัครสอบ</Label>
                                        <Input
                                            id="reg-amt"
                                            type="number"
                                            className="h-8"
                                            placeholder=">= ..."
                                            value={filters.registered_amount || ''}
                                            onChange={(e) => onFilterChange({ ...filters, registered_amount: e.target.value ? parseInt(e.target.value) : undefined })}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="pres-amt" className="text-xs">จำนวนเข้าสอบ</Label>
                                        <Input
                                            id="pres-amt"
                                            type="number"
                                            className="h-8"
                                            placeholder=">= ..."
                                            value={filters.present_amount || ''}
                                            onChange={(e) => onFilterChange({ ...filters, present_amount: e.target.value ? parseInt(e.target.value) : undefined })}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="trash-cnt" className="text-xs">ใบตอบที่ถูกลบ</Label>
                                        <Input
                                            id="trash-cnt"
                                            type="number"
                                            className="h-8"
                                            placeholder=">= ..."
                                            value={filters.trash_count || ''}
                                            onChange={(e) => onFilterChange({ ...filters, trash_count: e.target.value ? parseInt(e.target.value) : undefined })}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>

                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    {selectedTaskIds.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleRecalculateTasks}
                            disabled={recalculateTasksMutation.isPending}
                        >
                            {recalculateTasksMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Calculator className="mr-2 h-4 w-4" />
                            )}
                            คำนวณสถิติใหม่
                        </Button>
                    )}
                </div>

                {/* Search by Batch ID, not used yet */}
                {/* <div className="space-y-2 w-40">
                    <Label htmlFor="batch-id">ค้นหาจาก Batch ID</Label>
                    <Input
                        id="batch-id"
                        type="number"
                        placeholder="e.g. 123"
                        value={filters.latest_batch_id || ''}
                        onChange={(e) => onFilterChange({ ...filters, latest_batch_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                </div> */}
            </div>
        </div>
    );
}
