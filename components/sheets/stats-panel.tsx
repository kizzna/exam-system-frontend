import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { Loader2 } from 'lucide-react';

interface StatsPanelProps {
    taskId: string;
}

export function StatsPanel({ taskId }: StatsPanelProps) {
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
        <div className="flex flex-col gap-6">
            {/* Group 1: Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">สมัครสอบ</span>
                    <div className="text-2xl font-bold">{stats.registered_total.toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">เข้าสอบ</span>
                    <div className="text-2xl font-bold">{stats.present_total.toLocaleString()}</div>
                </div>
                {/* <div className="p-3 bg-blue-50 items-center flex rounded-lg border border-blue-100 shadow-sm"> */}
                <div className="flex flex-col items-center gap-1 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-xs font-medium text-blue-600 uppercase">จำนวนสแกน</div>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-blue-700">{stats.actual_sheets_total.toLocaleString()}</span>

                        {/* Diff Indicator */}
                        {(stats.actual_sheets_total - stats.present_total) !== 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded font-bold ml-2 ${(stats.actual_sheets_total < stats.present_total)
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
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-red-700">{stats.error_total.toLocaleString()}</span>
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
                        <div className="text-2xl font-bold text-orange-500">{stats.err_duplicate_sheets_total.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">อ่านได้ &lt; 141</span>
                        <div className="text-2xl font-bold text-yellow-500">{stats.err_low_answer_total.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">เลขที่ผิด</span>
                        <div className="text-2xl font-bold text-red-500">{stats.err_student_id_total.toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ขาดสอบมีใบตอบ</span>
                        <div className="text-2xl font-bold text-red-500">{stats.err_absent_count_total.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
