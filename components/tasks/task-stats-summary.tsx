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
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Set 1: Progress */}
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">สมัครสอบ</span>
                            <div className="text-2xl font-bold">{stats.registered_total.toLocaleString()}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">เข้าสอบ</span>
                            <div className="text-2xl font-bold">{stats.present_total.toLocaleString()}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">จำนวนสแกน</span>
                            <div className="text-2xl font-bold text-blue-600">{stats.actual_sheets_total.toLocaleString()}</div>
                        </div>
                    </div>

                    <Separator orientation="vertical" className="hidden h-12 md:block" />
                    <Separator orientation="horizontal" className="md:hidden" />

                    {/* Set 2: Errors */}
                    <div className="flex flex-1 flex-wrap gap-4">
                        <div className="space-y-1 mr-4">
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

                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:flex lg:flex-1 lg:items-center lg:justify-end lg:gap-4">
                            <StatItem label="ซ้ำ" value={stats.err_duplicate_sheets_total} color="bg-orange-500" />
                            <StatItem label="อ่านได้ < 140" value={stats.err_low_answer_total} color="bg-yellow-500" />
                            <StatItem label="เลขที่ผิด" value={stats.err_student_id_total} color="bg-red-500" />
                            <StatItem label="รหัสสนามผิด" value={stats.err_exam_center_id_total} color="bg-purple-500" />
                            <StatItem label="ชั้นผิด" value={stats.err_class_level_total} color="bg-blue-500" />
                            <StatItem label="ช่วงชั้นผิด" value={stats.err_class_group_total} color="bg-stone-500" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
    if (value === 0) return null;
    return (
        <div className="flex items-center gap-2">
            <Badge className={`${color} h-2 w-2 rounded-full p-0`} />
            <span className="text-sm text-muted-foreground">{label}:</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}
