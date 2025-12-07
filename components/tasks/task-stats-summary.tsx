'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TaskStats } from '@/lib/types/tasks';

interface TaskStatsSummaryProps {
    stats?: TaskStats;
    isLoading?: boolean;
}

export function TaskStatsSummary({ stats, isLoading }: TaskStatsSummaryProps) {
    if (isLoading) {
        return (
            <Card className="mb-6 bg-muted/50">
                <CardContent className="flex h-24 items-center justify-center p-6">
                    <div className="text-sm text-muted-foreground">Loading statistics...</div>
                </CardContent>
            </Card>
        );
    }

    if (!stats) return null;

    return (
        <Card className="mb-6">
            <CardContent className="p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    {/* Set 1: Progress */}
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">สมัครสอบ</span>
                            <div className="text-2xl font-bold">{stats.registered_total.toLocaleString()}</div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">เข้าสอบ</span>
                            <div className="text-2xl font-bold">{stats.present_total.toLocaleString()}</div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">จำนวนสแกน</span>
                            <div className="text-2xl font-bold text-blue-600">{stats.actual_sheets_total.toLocaleString()}</div>
                        </div>
                    </div>

                    <Separator orientation="vertical" className="hidden h-12 md:block" />
                    <Separator orientation="horizontal" className="md:hidden" />

                    {/* Set 2: Errors */}
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">จำนวนปัญหา</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-red-600">{stats.error_total.toLocaleString()}</span>
                                {stats.actual_sheets_total > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                        {((stats.error_total / stats.actual_sheets_total) * 100).toFixed(1)}%
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {stats.err_duplicate_sheets_total > 0 && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ซ้ำ</span>
                                <div className="text-2xl font-bold text-orange-500">{stats.err_duplicate_sheets_total.toLocaleString()}</div>
                            </div>
                        )}
                        {stats.err_low_answer_total > 0 && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">อ่านได้ {'<'} 141</span>
                                <div className="text-2xl font-bold text-yellow-500">{stats.err_low_answer_total.toLocaleString()}</div>
                            </div>
                        )}
                        {stats.err_student_id_total > 0 && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">เลขที่ผิด</span>
                                <div className="text-2xl font-bold text-red-500">{stats.err_student_id_total.toLocaleString()}</div>
                            </div>
                        )}
                        {stats.err_absent_count_total > 0 && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ขาดสอบมีใบตอบ</span>
                                <div className="text-2xl font-bold text-red-500">{stats.err_absent_count_total.toLocaleString()}</div>
                            </div>
                        )}
                        {stats.err_exam_center_id_total > 0 && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">รหัสสนามผิด</span>
                                <div className="text-2xl font-bold text-purple-500">{stats.err_exam_center_id_total.toLocaleString()}</div>
                            </div>
                        )}
                        {stats.err_class_level_total > 0 && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ชั้นผิด</span>
                                <div className="text-2xl font-bold text-blue-500">{stats.err_class_level_total.toLocaleString()}</div>
                            </div>
                        )}
                        {stats.err_class_group_total > 0 && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ช่วงชั้นผิด</span>
                                <div className="text-2xl font-bold text-stone-500">{stats.err_class_group_total.toLocaleString()}</div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


