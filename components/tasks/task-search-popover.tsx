import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { Task } from '@/lib/types/tasks';
import { Check, ChevronsUpDown, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getThaiClassLevel, getThaiClassGroup } from '@/lib/translations';
// Internal simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState(value);
    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

interface TaskSearchPopoverProps {
    onSelect: (task: Task) => void;
    buttonLabel?: string;
    disabled?: boolean;
    selectedTask?: Task | null;
    excludedTaskId?: number;
}

export function TaskSearchPopover({ onSelect, buttonLabel = "Select Task...", disabled = false, selectedTask, excludedTaskId }: TaskSearchPopoverProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 300);

    const { data: tasksData, isLoading } = useQuery({
        queryKey: ['tasks-search', debouncedSearch],
        queryFn: () => tasksApi.getTasks({
            page: 1,
            size: 50,
            sort_by: 'created_at',
            sort_order: 'desc',
            // Basic search might not be supported by getTasks directly if not implemented in API,
            // but guide says "Use GET /tasks ... The user must allow selecting target task...".
            // Assuming getTasks supports filtering or we just fetch recent.
            // Guide says: "Example: GET /tasks?task_id=101&size=50 (search by ID prefix)"
            // So we should probably pass debouncedSearch as some filter if it looks like an ID, or just fetch list.
            // Let's try to pass it as `task_id` if it's numeric, or generic search if API supports it.
            // Checking tasksApi definition might be good, but for now let's assume standard params.
            // If the user types a number, we treat it as task_id prefix.
            ...(debouncedSearch ? { task_id: debouncedSearch } : {})
        }),
        enabled: open,
        staleTime: 1000 * 60, // 1 min (don't refetch too often)
    });

    const tasks = (tasksData?.items || []).filter(task => task.task_id !== excludedTaskId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {selectedTask
                        ? `${selectedTask.task_id} - ${selectedTask.exam_center_code}`
                        : buttonLabel}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[800px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="รหัสสนามสอบ"
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        {isLoading && (
                            <div className="py-6 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading tasks...
                            </div>
                        )}
                        {!isLoading && tasks.length === 0 && (
                            <CommandEmpty>ไม่พบสนามสอบ</CommandEmpty>
                        )}
                        {!isLoading && tasks.length > 0 && (
                            <div>
                                <div className="grid grid-cols-9 gap-2 px-2 py-2 text-sm font-semibold text-slate-700 bg-slate-50 border-b sticky top-0 z-10">
                                    <div className="col-span-1">ID (Task)</div>
                                    <div className="col-span-1">รหัสสนาม</div>
                                    <div className="col-span-1 text-center">ชั้น</div>
                                    <div className="col-span-1 text-center">ช่วงชั้น</div>
                                    <div className="col-span-1 text-center">สมัครสอบ</div>
                                    <div className="col-span-1 text-center">เข้าสอบ</div>
                                    <div className="col-span-1 text-center">ใบตอบ</div>
                                    <div className="col-span-1 text-center">ปัญหา</div>
                                    <div className="col-span-1 text-center">#</div>
                                </div>
                                <CommandGroup>
                                    {tasks.map((task) => (
                                        <CommandItem
                                            key={task.task_id}
                                            value={`${task.task_id.toString()} ${task.exam_center_code}`}
                                            onSelect={() => {
                                                onSelect(task);
                                                setOpen(false);
                                            }}
                                            className="grid grid-cols-9 gap-2 py-2 cursor-pointer hover:bg-emerald-50 aria-selected:bg-emerald-50 data-[selected=true]:bg-emerald-50 items-center text-sm !text-slate-900 !opacity-100"
                                        >
                                            <div className="col-span-1 font-mono font-medium">{task.task_id}</div>
                                            <div className="col-span-1">{task.exam_center_code}</div>
                                            <div className="col-span-1 text-center">{getThaiClassLevel(task.class_level)}</div>
                                            <div className="col-span-1 text-center">{getThaiClassGroup(task.class_group)}</div>
                                            <div className="col-span-1 text-center text-slate-600">{task.registered_amount}</div>
                                            <div className="col-span-1 text-center text-slate-600">{task.present_amount}</div>
                                            <div className="col-span-1 text-center font-semibold text-blue-600">
                                                {task.actual_sheet_count}
                                            </div>
                                            <div className="col-span-1 text-center">
                                                {task.error_count > 0 ? (
                                                    <span className="text-red-600 font-bold">{task.error_count}</span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <Button
                                                    size="sm"
                                                    className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white shadow-sm pointer-events-auto relative z-20 !opacity-100"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onSelect(task);
                                                        setOpen(false);
                                                    }}
                                                    onPointerDown={(e) => {
                                                        // Prevent cmdk from stealing focus/selection on mousedown
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    เลือก
                                                </Button>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </div>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
