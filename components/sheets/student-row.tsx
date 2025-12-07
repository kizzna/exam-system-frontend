import React, { useState } from 'react';
import { RosterEntry } from '@/lib/types/tasks';
import { cn, calculateStudentRoll } from '@/lib/utils';
import { Ghost, AlertTriangle, HelpCircle, UserX, CheckCircle, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { sheetsApi } from '@/lib/api/sheets';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface StudentRowProps {
    entry: RosterEntry;
    style: React.CSSProperties;
    isSelected: boolean;
    isClickable: boolean;
    onSelect: () => void;
    viewMode: 'PRIORITY' | 'SEQUENTIAL';
    fullRoster: RosterEntry[];
    classLevel: number;
    group: number;
}

export const StudentRow = React.memo(({ entry, style, isSelected, isClickable, onSelect, viewMode, fullRoster, classLevel, group }: StudentRowProps) => {
    const queryClient = useQueryClient();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [search, setSearch] = useState("");

    const { exactMatches, startsWithMatches, otherMatches } = React.useMemo(() => {
        const empty = { exactMatches: [], startsWithMatches: [], otherMatches: [] };
        if (!search) return { ...empty, otherMatches: fullRoster.slice(0, 50) };

        const searchTrimmed = search.trim();
        const searchLower = searchTrimmed.toLowerCase();

        const exact: RosterEntry[] = [];
        const starts: RosterEntry[] = [];
        const others: RosterEntry[] = [];

        const searchNum = parseInt(searchTrimmed, 10);
        const isSearchNumeric = !isNaN(searchNum);

        fullRoster.forEach(s => {
            const rollStr = s.master_roll ? s.master_roll.toString() : '';
            const rollNum = parseInt(rollStr, 10);
            const nameLower = s.student_name ? s.student_name.toLowerCase() : '';

            // 1. Exact Match
            if (isSearchNumeric && !isNaN(rollNum) && rollNum === searchNum) {
                exact.push(s);
                return;
            }

            // 2. Starts With
            if (rollStr.startsWith(searchTrimmed)) {
                starts.push(s);
                return;
            }

            // 3. Others
            if (rollStr.includes(searchTrimmed) || nameLower.includes(searchLower)) {
                others.push(s);
            }
        });

        const sortNumeric = (a: RosterEntry, b: RosterEntry) => {
            const ra = parseInt(a.master_roll?.toString() || '0', 10);
            const rb = parseInt(b.master_roll?.toString() || '0', 10);
            return ra - rb;
        };

        exact.sort(sortNumeric);
        starts.sort(sortNumeric);
        others.sort(sortNumeric);

        return { exactMatches: exact, startsWithMatches: starts, otherMatches: others };
    }, [fullRoster, search]);

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

    const handleAssignStudent = async (targetStudent: RosterEntry) => {
        if (!entry.sheet_id) return;
        // ... (existing logic)
        try {
            // Calculate 5-digit roll number if sheet_roll is missing
            const finalRoll = calculateStudentRoll(classLevel, group, targetStudent.master_roll || '')
                || targetStudent.sheet_roll
                || targetStudent.master_roll
                || '';

            await sheetsApi.updateSheetInfo({
                sheet_ids: [entry.sheet_id],
                updates: { student_roll: finalRoll }
            });

            toast.success(`Assigned sheet to ${targetStudent.student_name}`);
            setIsPopoverOpen(false);
            queryClient.invalidateQueries({ queryKey: ['roster'] });
        } catch (error) {
            toast.error("Failed to update student assignment");
        }
    };

    const handleManualAssign = async (manualInput: string) => {
        if (!entry.sheet_id) return;

        try {
            const finalRoll = calculateStudentRoll(classLevel, group, manualInput);

            // Try to find the student for better toast message (optional)
            const matchedStudent = fullRoster.find(s => s.master_roll && s.master_roll.toString() === manualInput);
            const name = matchedStudent ? matchedStudent.student_name : `roll ${manualInput}`;

            await sheetsApi.updateSheetInfo({
                sheet_ids: [entry.sheet_id],
                updates: { student_roll: finalRoll }
            });

            toast.success(`Assigned sheet to ${name}`);
            setIsPopoverOpen(false);
            queryClient.invalidateQueries({ queryKey: ['roster'] });
        } catch (error) {
            toast.error("Failed to update manual assignment");
        }
    };

    const handleQuickAction = async (e: React.MouseEvent, type: 'present' | 'too_few') => {
        // ... (existing logic)
        e.stopPropagation();
        if (!entry.sheet_id) return;

        try {
            await sheetsApi.verifySheet(entry.sheet_id, {
                corrected_flags: {
                    marked_present: type === 'present' ? true : undefined,
                    too_few_answers: type === 'too_few' ? true : undefined
                }
            });
            toast.success("Updated sheet status");
            queryClient.invalidateQueries({ queryKey: ['roster'] });
        } catch (error) {
            toast.error("Failed to update status");
        }
    }

    return (
        <div
            style={style}
            className="p-1"
        >
            <div
                onClick={() => isClickable && onSelect()}
                className={cn(
                    "p-2 rounded text-sm flex justify-between items-center transition-colors h-full",
                    getRowStyle(entry.row_status),
                    isSelected ? "bg-blue-100 border-blue-200 ring-1 ring-blue-300" : "hover:bg-slate-100",
                    isClickable ? "cursor-pointer" : "cursor-default",
                    !isClickable && !isSelected && "border border-transparent"
                )}
            >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="shrink-0">
                        {getStatusIcon(entry.row_status)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className={cn(
                            "font-medium truncate",
                            entry.row_status === 'GHOST' ? "text-slate-500 italic" : "text-slate-700"
                        )}>
                            {entry.student_name}
                        </span>

                        {/* Smart Input Area */}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            {viewMode === 'SEQUENTIAL' && entry.sheet_id ? (
                                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsPopoverOpen(true); setSearch(""); }}
                                            className="hover:bg-slate-200 px-1 rounded -ml-1 flex items-center gap-1 transition-colors text-left"
                                        >
                                            <span>{entry.master_roll || 'No ID'}</span>
                                            {entry.sheet_roll && entry.sheet_roll !== entry.master_roll && (
                                                <span className="text-orange-600 font-mono">
                                                    → {entry.sheet_roll}
                                                </span>
                                            )}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search student ID..."
                                                value={search}
                                                onValueChange={setSearch}
                                            />
                                            <CommandList>
                                                <CommandEmpty>No student found.</CommandEmpty>

                                                {/* Manual Input Option */}
                                                {search && !isNaN(parseInt(search)) && (
                                                    <CommandItem
                                                        value={`manual-${search}`}
                                                        onSelect={() => handleManualAssign(search)}
                                                    >
                                                        <span className="font-medium text-blue-600 flex items-center gap-2">
                                                            Assign ID: {search}
                                                            <span className="text-xs text-slate-400 font-normal">
                                                                (→ {calculateStudentRoll(classLevel, group, search)})
                                                            </span>
                                                        </span>
                                                    </CommandItem>
                                                )}

                                                {/* Exact Matches Group */}
                                                {exactMatches.length > 0 && (
                                                    <CommandGroup heading="Exact Match">
                                                        {exactMatches.map((student) => (
                                                            <CommandItem
                                                                key={student.master_roll || student.student_name}
                                                                value={`${student.master_roll} ${student.student_name}`}
                                                                onSelect={() => handleAssignStudent(student)}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold">{student.student_name} ({student.master_roll})</span>
                                                                    <span className={cn(
                                                                        "text-xs",
                                                                        student.row_status === 'MISSING' ? "text-green-600" : "text-orange-500"
                                                                    )}>
                                                                        Status: {student.row_status}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                )}

                                                {/* Starts With Matches Group */}
                                                {startsWithMatches.length > 0 && (
                                                    <CommandGroup heading="Matches ID">
                                                        {startsWithMatches.map((student) => (
                                                            <CommandItem
                                                                key={student.master_roll || student.student_name}
                                                                value={`${student.master_roll} ${student.student_name}`}
                                                                onSelect={() => handleAssignStudent(student)}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span>{student.student_name} ({student.master_roll})</span>
                                                                    <span className={cn(
                                                                        "text-xs",
                                                                        student.row_status === 'MISSING' ? "text-green-600" : "text-orange-500"
                                                                    )}>
                                                                        Status: {student.row_status}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                )}

                                                {/* Other Matches Group */}
                                                {otherMatches.length > 0 && (
                                                    <CommandGroup heading="Other Matches">
                                                        {otherMatches.map((student) => (
                                                            <CommandItem
                                                                key={student.master_roll || student.student_name}
                                                                value={`${student.master_roll} ${student.student_name}`}
                                                                onSelect={() => handleAssignStudent(student)}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span>{student.student_name} ({student.master_roll})</span>
                                                                    <span className={cn(
                                                                        "text-xs",
                                                                        student.row_status === 'MISSING' ? "text-green-600" : "text-orange-500"
                                                                    )}>
                                                                        Status: {student.row_status}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <>
                                    <span>{entry.master_roll || 'No ID'}</span>
                                    {entry.sheet_roll && entry.sheet_roll !== entry.master_roll && (
                                        <span className="text-orange-600 font-mono">
                                            → {entry.sheet_roll}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Quick Actions for Sequential View */}
                    {viewMode === 'SEQUENTIAL' && (
                        <>
                            {entry.row_status === 'UNEXPECTED' && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-xs bg-white/50 hover:bg-white text-green-700 border border-green-200"
                                    onClick={(e) => handleQuickAction(e, 'present')}
                                >
                                    Mark Present
                                </Button>
                            )}
                            {entry.row_status === 'ERROR' && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-xs bg-white/50 hover:bg-white text-orange-700 border border-orange-200"
                                    onClick={(e) => handleQuickAction(e, 'too_few')}
                                >
                                    Too few
                                </Button>
                            )}
                        </>
                    )}

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
        </div>
    );
});

StudentRow.displayName = 'StudentRow';
