import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Telescope, Loader2, X, Search } from 'lucide-react';
import { studentsApi } from '@/lib/api/students';
import { Student } from '@/lib/types/students';
import { cn } from '@/lib/utils';
// Checking imports, standard environment usually has it or I can write custom.
// Given no package.json check, I'll write custom debounce inside component to be safe.

interface StudentSearchModalProps {
    className?: string;
}

export const StudentSearchModal: React.FC<StudentSearchModalProps> = ({ className }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [results, setResults] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const LIMIT = 50;

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
            setOffset(0); // Reset pagination on new query
        }, 1000);
        return () => clearTimeout(handler);
    }, [query]);

    // Validation
    const isValidInput = (q: string) => {
        if (!q) return false;

        // 1. Numeric Check
        const numericMatch = q.match(/^(\d+)/);
        if (numericMatch) {
            const digits = numericMatch[1];
            if (digits.length >= 7) {
                // Check 7th digit (must be 1-3)
                const digit7 = parseInt(digits[6]); // 0-indexed
                if (digit7 < 1 || digit7 > 3) return false;
            }
            if (digits.length >= 8) {
                // Check 8th digit (must be 1-3)
                const digit8 = parseInt(digits[7]);
                if (digit8 < 1 || digit8 > 3) return false;
            }
        }

        // 2. Character Check (Thai or English or Numbers or Space)
        const validChars = /^[0-9a-zA-Z\u0E00-\u0E7F\s]+$/;
        if (!validChars.test(q)) return false;

        return true;
    };

    const getClassLevelLabel = (level: string) => {
        const map: Record<string, string> = {
            '1': 'นธ.ตรี',
            '2': 'นธ.โท',
            '3': 'นธ.เอก',
            '4': 'ธศ.ตรี',
            '5': 'ธศ.โท',
            '6': 'ธศ.เอก'
        };
        return map[level] || level;
    };

    const getClassGroupLabel = (group: string) => {
        const map: Record<string, string> = {
            '1': 'ประถม',
            '2': 'มัธยม',
            '3': 'อุดม',
            '111': 'นธ.ตรี',
            '112': 'นธ.โท',
            '113': 'นธ.เอก'
        };
        return map[group] || group;
    };

    const searchStudents = useCallback(async (searchQuery: string, currentOffset: number, append: boolean) => {
        if (!searchQuery || !isValidInput(searchQuery)) {
            setResults([]);
            setHasMore(false);
            return;
        }

        setLoading(true);
        try {
            const response = await studentsApi.searchStudents({
                q: searchQuery,
                limit: LIMIT,
                offset: currentOffset
            });

            if (append) {
                setResults(prev => [...prev, ...response.data]);
            } else {
                setResults(response.data);
            }

            setHasMore(response.data.length === LIMIT);
        } catch (error) {
            console.error("Search failed:", error);
            // Optionally toast error
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect to trigger search
    useEffect(() => {
        searchStudents(debouncedQuery, 0, false);
    }, [debouncedQuery, searchStudents]);

    const loadMore = () => {
        if (!loading && hasMore) {
            const newOffset = offset + LIMIT;
            setOffset(newOffset);
            searchStudents(debouncedQuery, newOffset, true);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("text-blue-600 hover:text-blue-700 hover:bg-blue-50", className)}
                    title="Search Students"
                >
                    <Telescope className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-[1200px] max-h-[85vh] flex flex-col p-0 gap-0 bg-white">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-slate-500" />
                        ค้นหารายชื่อผู้สมัครสอบ
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 border-b bg-slate-50">
                    <Input
                        placeholder="รหัสสนาม หรือ ชื่อ/สกุล, รหัสสนาม และ ชื่อ/สกุล"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="max-w-md bg-white font-mono"
                        autoFocus
                    />
                    {!isValidInput(query) && query.length > 0 && (
                        <p className="text-xs text-red-500 mt-2">
                            ข้อมูลไม่ถูกต้อง. ส่วนแรกจะต้องเป็น รหัสสนามสอบหรือชื่อ/สกุล.
                            กรณีรหัสสนามสอบ หลักที่ 7 และ 8 จะต้องเป็น 1-3 เท่านั้น
                        </p>
                    )}
                </div>

                <div className="flex-1 overflow-auto p-0 min-h-[300px]">
                    <Table>
                        <TableHeader className="bg-slate-100 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[120px]">มาสอบ?</TableHead>
                                {/* <TableHead>Task ID</TableHead> */}
                                <TableHead>รหัสสนามสอบ</TableHead>
                                <TableHead>สนร./คณะจังหวัด</TableHead>
                                <TableHead>ชั้น</TableHead>
                                <TableHead>ช่วงชั้น</TableHead>
                                <TableHead>เลขที่สอบ</TableHead>
                                <TableHead>เลขที่</TableHead>
                                <TableHead>ชื่อผู้สอบ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && results.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        กำลังค้นหา...
                                    </TableCell>
                                </TableRow>
                            )}

                            {!loading && results.length === 0 && query && (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                                        ไม่พบรายชื่อผู้สมัครสอบที่ค้นหา
                                    </TableCell>
                                </TableRow>
                            )}

                            {results.map((student, idx) => (
                                <TableRow key={`${student.task_id}-${student.student_roll}-${idx}`} className="hover:bg-slate-50">
                                    <TableCell>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-xs font-medium",
                                            student.present_status === 'มาสอบ' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        )}>
                                            {student.present_status}
                                        </span>
                                    </TableCell>
                                    {/* <TableCell className="font-mono">{student.task_id}</TableCell> */}
                                    <TableCell className="font-mono">{student.exam_center_code}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={student.snr_name}>
                                        {student.snr_name}
                                    </TableCell>
                                    <TableCell>{getClassLevelLabel(student.class_level)}</TableCell>
                                    <TableCell>{getClassGroupLabel(student.class_group)}</TableCell>
                                    <TableCell className="font-mono font-semibold">{student.student_roll}</TableCell>
                                    <TableCell className="font-mono text-slate-500">{student.master_roll}</TableCell>
                                    <TableCell className="font-medium">
                                        {student.prefix_name}{student.firstname} {student.lastname}
                                    </TableCell>
                                </TableRow>
                            ))}

                            {hasMore && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={loadMore}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            แสดงเพิ่ม
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {results.length > 0 && (
                    <div className="p-2 border-t text-xs text-slate-500 text-right bg-slate-50">
                        {results.length} รายชื่อผู้สมัครสอบที่แสดง
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
