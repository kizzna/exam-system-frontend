import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { sheetsApi } from '@/lib/api/sheets';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { TaskSearchPopover } from '@/components/tasks/task-search-popover';
import { Task } from '@/lib/types/tasks';
import { toast } from 'sonner';

interface StatsPanelProps {
    taskId: string;
}

export function StatsPanel({ taskId }: StatsPanelProps) {
    const queryClient = useQueryClient();
    const { data: stats, isLoading } = useQuery({
        queryKey: ['task-stats', taskId],
        queryFn: () => tasksApi.getTaskStats({ task_id: taskId }),
    });

    if (isLoading) {
        return (
            <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    const errorPercentage = stats.actual_sheets_total > 0
        ? ((stats.error_total / stats.actual_sheets_total) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="flex flex-col gap-1">
            {/* Header / Actions Row */}
            {/* <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSwapDialogOpen(true)}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                >
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    สลับใบตอบกับสนาม...
                </Button>
            </div> */}

            {/* Group 1: Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">สมัครสอบ</span>
                    <div className="text-lg font-bold">{stats.registered_total.toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">เข้าสอบ</span>
                    <div className="text-lg font-bold">{stats.present_total.toLocaleString()}</div>
                </div>
                {/* <div className="p-3 bg-blue-50 items-center flex rounded-lg border border-blue-100 shadow-sm"> */}
                <div className="flex flex-col items-center gap-1 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-xs font-medium text-blue-600 uppercase">จำนวนสแกน</div>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-lg font-bold text-blue-700">{stats.actual_sheets_total.toLocaleString()}</span>

                        {/* Diff Indicator */}
                        {(stats.actual_sheets_total - stats.present_total) !== 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${(stats.actual_sheets_total < stats.present_total)
                                ? 'bg-red-100 text-red-600' // Missing
                                : 'bg-orange-100 text-orange-600' // Excess
                                }`}>
                                {stats.actual_sheets_total < stats.present_total
                                    ? `( หาย ${Math.abs(stats.present_total - stats.actual_sheets_total).toLocaleString()} )`
                                    : `( เกิน ${Math.abs(stats.actual_sheets_total - stats.present_total).toLocaleString()} )`
                                }
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-xs font-medium text-red-600 uppercase tracking-wider">จำนวนปัญหา</span>
                    <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-red-700">{stats.error_total.toLocaleString()}</span>
                        <div className="inline-flex items-center rounded-full bg-white border border-red-200 px-2 py-0.5 text-xs font-bold text-red-700">
                            {errorPercentage}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Group 2: Specific Errors */}
            <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center gap-1 p-2 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ซ้ำ</span>
                        <div className="text-lg font-bold text-orange-500">{stats.err_duplicate_sheets_total.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">อ่านได้ &lt; 141</span>
                        <div className="text-lg font-bold text-yellow-500">{stats.err_low_answer_total.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">เลขที่ผิด</span>
                        <div className="text-lg font-bold text-red-500">{stats.err_student_id_total.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ขาดสอบมีใบตอบ</span>
                        <div className="text-lg font-bold text-red-500">{stats.err_absent_count_total.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Swap Dialog Removed */}
        </div>
    );
}
