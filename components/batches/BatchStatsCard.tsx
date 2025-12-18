'use client';

import { useQuery } from '@tanstack/react-query';
import { getBatchStats } from '@/lib/api/batches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface BatchStatsCardProps {
    batchId: string;
}

export function BatchStatsCard({ batchId }: BatchStatsCardProps) {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['batch-stats', batchId],
        queryFn: () => getBatchStats(batchId),
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Batch Statistics</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </CardContent>
            </Card>
        );
    }

    if (error || !stats) {
        return null; // Don't show if error or no data (optional, or show error state)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>ผลการตรวจเบื้องต้น</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">สมัครสอบ</p>
                        <p className="text-2xl font-bold">{stats.registered_total}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">จำนวนสแกน</p>
                        <p className="text-2xl font-bold">{stats.sheets_total}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">จำนวนปัญหา</p>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold">{stats.error_total}</p>
                            {stats.error_total > 0 && (
                                <Badge variant="destructive" className="rounded-full">
                                    {((stats.error_total / stats.sheets_total) * 100).toFixed(1)}%
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm font-medium">ใบตอบซ้ำ</span>
                        <Badge className="bg-orange-500 hover:bg-orange-600">{stats.err_duplicate_sheets_total}</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm font-medium">ตอบไม่ถึง 140 ข้อ</span>
                        <Badge className="bg-yellow-500 hover:bg-yellow-600">{stats.err_low_answer_total}</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm font-medium">เลขที่สอบผิด</span>
                        <Badge variant="destructive">{stats.err_student_id_total}</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
