'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
    // Fetch Roster using task_id
    const { data: roster, isLoading } = useQuery({
        queryKey: ['roster', taskId],
        queryFn: () => tasksApi.getRoster(parseInt(taskId)),
    });

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
        <div className="space-y-1">
            <TooltipProvider>
                {roster.map((entry, i) => {
                    const isSelected = entry.sheet_id === selectedSheetId;
                    const isClickable = !!entry.sheet_id; // Only clickable if there is a sheet

                    return (
                        <div
                            key={entry.sheet_id || `missing-${entry.master_roll}`}
                            onClick={() => isClickable && entry.sheet_id && onSelectSheet(entry.sheet_id)}
                            className={cn(
                                "p-2 rounded text-sm flex justify-between items-center transition-colors",
                                getRowStyle(entry.row_status),
                                isSelected ? "bg-blue-100 border-blue-200" : "hover:bg-slate-100",
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
                    );
                })}
            </TooltipProvider>
        </div>
    );
}
