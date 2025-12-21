'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { masterDataApi } from '@/lib/api/master-data';
import { useAuth } from '@/lib/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UserStatsPage() {
    const { isAdmin } = useAuth();
    const [mounted, setMounted] = useState(false);

    // Filters
    const [evalCenterId, setEvalCenterId] = useState<string>('all');
    const [classLevel, setClassLevel] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch evaluation centers for filter
    const { data: evalCenters } = useQuery({
        queryKey: ['evaluation-centers'],
        queryFn: masterDataApi.getEvaluationCenters,
        enabled: isAdmin,
    });

    // Fetch stats
    const { data, isLoading, error } = useQuery({
        queryKey: ['user-stats', evalCenterId, classLevel],
        queryFn: () => usersApi.getUserStats({
            eval_center_id: evalCenterId !== 'all' ? parseInt(evalCenterId) : undefined,
            class_level: classLevel !== 'all' ? parseInt(classLevel) : undefined,
        }),
        enabled: isAdmin,
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (!isAdmin) {
        return (
            <div>
                <h1 className="mb-6 text-3xl font-bold">User Stats</h1>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-destructive">You do not have permission to access this page.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Filter stats client-side by username/fullname search if needed, 
    // though the requirement only mentioned API params for eval/class.
    // We'll filter the displayed list by the search query.
    const filteredStats = data?.stats.filter(stat =>
        stat.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stat.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-center">
                <h1 className="text-3xl font-bold">สถิติตรวจข้อสอบของผู้ใช้</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>กรองข้อมูล</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-[250px]">
                            <Label htmlFor="eval-center-filter" className="mb-2 block">กองงาน</Label>
                            <Select value={evalCenterId} onValueChange={setEvalCenterId}>
                                <SelectTrigger id="eval-center-filter">
                                    <SelectValue placeholder="ทุกกองงาน" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทุกกองงาน</SelectItem>
                                    {evalCenters?.map((center) => (
                                        <SelectItem key={center.id} value={center.id.toString()}>
                                            {center.name} ({center.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-[200px]">
                            <Label htmlFor="class-level-filter" className="mb-2 block">ระดับชั้น</Label>
                            <Select value={classLevel} onValueChange={setClassLevel}>
                                <SelectTrigger id="class-level-filter">
                                    <SelectValue placeholder="ทุกระดับชั้น" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทุกระดับชั้น</SelectItem>
                                    <SelectItem value="1">ชั้นตรี</SelectItem>
                                    <SelectItem value="2">ชั้นโท</SelectItem>
                                    <SelectItem value="3">ชั้นเอก</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-[250px]">
                            <Label htmlFor="search-filter" className="mb-2 block">ค้นหาผู้ใช้</Label>
                            <Input
                                id="search-filter"
                                placeholder="ค้นหาผู้ใช้ด้วย username หรือชื่อ"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center">Loading stats...</div>
                    ) : error ? (
                        <div className="p-8 text-center text-destructive">Error loading stats: {(error as Error).message}</div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>username</TableHead>
                                        <TableHead>ชื่อผู้ตรวจ</TableHead>
                                        <TableHead className="text-right">สนร.</TableHead>
                                        <TableHead className="text-right">สมัครสอบ</TableHead>
                                        <TableHead className="text-right">คงสอบ</TableHead>
                                        <TableHead className="text-right">สแกน</TableHead>
                                        <TableHead className="text-right text-red-600">ปัญหา</TableHead>
                                        <TableHead className="text-right text-red-600">ซ้ำ</TableHead>
                                        <TableHead className="text-right text-red-600">&lt; 140 ข้อ</TableHead>
                                        <TableHead className="text-right text-red-600">เลขที่สอบ</TableHead>
                                        <TableHead className="text-right text-red-600">ขาดสอบมีใบตอบ</TableHead>
                                        <TableHead className="text-right text-red-600">ถูกลบ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStats.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="h-24 text-center">
                                                No results found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStats.map((stat) => (
                                            <TableRow key={stat.user_id}>
                                                <TableCell className="font-medium">{stat.username}</TableCell>
                                                <TableCell>{stat.full_name}</TableCell>
                                                <TableCell className="text-right">{stat.snr_count.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{stat.registered_amount.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{stat.present_amount.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{stat.actual_sheet_count.toLocaleString()}</TableCell>
                                                <TableCell className="text-right font-bold text-red-600">{stat.error_count > 0 ? stat.error_count.toLocaleString() : '-'}</TableCell>
                                                <TableCell className="text-right text-red-600">{stat.err_duplicate_sheets_count > 0 ? stat.err_duplicate_sheets_count.toLocaleString() : '-'}</TableCell>
                                                <TableCell className="text-right text-red-600">{stat.err_low_answer_count > 0 ? stat.err_low_answer_count.toLocaleString() : '-'}</TableCell>
                                                <TableCell className="text-right text-red-600">{stat.err_student_id_count > 0 ? stat.err_student_id_count.toLocaleString() : '-'}</TableCell>
                                                <TableCell className="text-right text-red-600">{stat.err_absent_count > 0 ? stat.err_absent_count.toLocaleString() : '-'}</TableCell>
                                                <TableCell className="text-right text-red-600">{stat.err_trash_count > 0 ? stat.err_trash_count.toLocaleString() : '-'}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
