import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { tasksApi } from '@/lib/api/tasks';
import { Loader2, AlertTriangle, Ghost, UserX, CheckCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RosterEntry } from '@/lib/types/tasks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StudentTableProps {
    taskId: string;
    selectedSheetId?: string;
    onSelectSheet: (id: string) => void;
}

export function StudentTable({ taskId, selectedSheetId, onSelectSheet }: StudentTableProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    // Fetch Roster using task_id
    const { data: roster, isLoading } = useQuery({
        queryKey: ['roster', taskId],
        queryFn: () => tasksApi.getRoster(parseInt(taskId)),
    });

    const rowVirtualizer = useVirtualizer({
        count: roster?.length || 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 50, // Estimate row height
        overscan: 5,
    });

    // Keyboard Navigation
    useEffect(() => {
        if (!roster || roster.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if no input/textarea is focused
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            const currentIndex = roster.findIndex(r => r.sheet_id === selectedSheetId);
            let nextIndex = currentIndex;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    nextIndex = Math.min(roster.length - 1, currentIndex + 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    nextIndex = Math.max(0, currentIndex - 1);
                    break;
                case 'PageDown':
                    e.preventDefault();
                    nextIndex = Math.min(roster.length - 1, currentIndex + 10);
                    break;
                case 'PageUp':
                    e.preventDefault();
                    nextIndex = Math.max(0, currentIndex - 10);
                    break;
                case 'Home':
                    e.preventDefault();
                    nextIndex = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    nextIndex = roster.length - 1;
                    break;
                default:
                    return;
            }

            if (nextIndex !== currentIndex) {
                const nextItem = roster[nextIndex];
                if (nextItem.sheet_id) {
                    onSelectSheet(nextItem.sheet_id);
                    rowVirtualizer.scrollToIndex(nextIndex, { align: 'center' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [roster, selectedSheetId, onSelectSheet, rowVirtualizer]);

    // Scroll to selected item on initial load or external selection change
    useEffect(() => {
        if (roster && selectedSheetId) {
            const index = roster.findIndex(r => r.sheet_id === selectedSheetId);
            if (index !== -1) {
                rowVirtualizer.scrollToIndex(index, { align: 'center' });
            }
        }
    }, [selectedSheetId, roster, rowVirtualizer]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!roster || roster.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No students found
            </div>
        );
    }

    const getStatusIcon = (status: RosterEntry['row_status']) => {
        switch (status) {
            case 'GHOST': return <Ghost className="w-4 h-4 text-red-500" />;
            case 'ERROR': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            case 'UNEXPECTED': return <HelpCircle className="w-4 h-4 text-yellow-500" />;
            case 'MISSING': return <UserX className="w-4 h-4 text-slate-400" />;
            case 'OK': return <CheckCircle className="w-4 h-4 text-green-500" />;
            default: return null;
        }
    };

    const getRowStyle = (status: RosterEntry['row_status']) => {
        switch (status) {
            case 'GHOST': return "border-l-4 border-l-red-500 bg-red-50/50";
            case 'ERROR': return "border-l-4 border-l-orange-500 bg-orange-50/50";
            case 'UNEXPECTED': return "bg-yellow-50";
            case 'MISSING': return "opacity-60 bg-slate-50";
            case 'OK': return "border-l-4 border-l-green-500";
            default: return "";
        }
    };

    return (
        <div ref={parentRef} className="h-full overflow-auto bg-white p-2">
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                <TooltipProvider>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const entry = roster[virtualRow.index];
                        const isSelected = entry.sheet_id === selectedSheetId;
                        const isClickable = !!entry.sheet_id;

                        return (
                            <div
                                key={entry.sheet_id || `missing-${entry.master_roll}`}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                                className="p-1" // Add padding for spacing between rows
                            >
                                <div
                                    onClick={() => isClickable && entry.sheet_id && onSelectSheet(entry.sheet_id)}
                                    className={cn(
                                        "p-2 rounded text-sm flex justify-between items-center transition-colors h-full",
                                        getRowStyle(entry.row_status),
                                        isSelected ? "bg-blue-100 border-blue-200 ring-1 ring-blue-300" : "hover:bg-slate-100",
                                        isClickable ? "cursor-pointer" : "cursor-default",
                                        !isClickable && !isSelected && "border border-transparent"
                                    )}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="shrink-0">
                                            {getStatusIcon(entry.row_status)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={cn(
                                                "font-medium truncate",
                                                entry.row_status === 'GHOST' ? "text-slate-500 italic" : "text-slate-700"
                                            )}>
                                                {entry.student_name}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span>{entry.master_roll || 'No ID'}</span>
                                                {entry.sheet_roll && entry.sheet_roll !== entry.master_roll && (
                                                    <span className="text-orange-600 font-mono">
                                                        → {entry.sheet_roll}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {entry.error_message && (
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{entry.error_message}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </TooltipProvider>
            </div>
        </div>
    );
}
