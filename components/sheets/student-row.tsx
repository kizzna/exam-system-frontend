import React, { useState } from 'react';
import { RosterEntry } from '@/lib/types/tasks';
import { cn, calculateStudentRoll } from '@/lib/utils';
import { Ghost, AlertTriangle, HelpCircle, UserX, CheckCircle, Search, Wrench } from 'lucide-react';
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
    taskId: string;
}

function applyRosterUpdates(oldRoster: RosterEntry[], updatedRows: RosterEntry[]): RosterEntry[] {
    const updates = [...updatedRows];
    const updatesConsumed = new Set<number>(); // Index of consumed updates

    // Identify all sheet_ids involved in the update
    const updatedSheetIds = new Set(updates.map(u => u.sheet_id ? String(u.sheet_id) : '').filter(Boolean));

    // Pass 1: Map (Update Existing)
    let newRoster = oldRoster.map(row => {
        // Match logic
        const updateIndex = updates.findIndex(u => {
            if (row.source === 'master') {
                return u.source === 'master' && String(u.master_roll) === String(row.master_roll);
            } else { // ghost
                return u.source === 'ghost' && String(u.sheet_id) === String(row.sheet_id);
            }
        });

        if (updateIndex !== -1) {
            updatesConsumed.add(updateIndex);
            return updates[updateIndex];
        }

        // Check 2: Sheet Stealing (Did this row lose its sheet?)
        // If this row has a sheet that is present in the updates (assigned to someone else since we didn't match above),
        // then this row lost it.
        if (row.sheet_id && updatedSheetIds.has(String(row.sheet_id))) {
            if (row.source === 'master') {
                // Reset Master Row to defaults
                return {
                    ...row,
                    sheet_id: null,
                    sheet_roll: null,
                    error_flags: 0,
                    corrected_flags: 0,
                    effective_flags: 0,
                    original_filename: null,
                    row_status: 'MISSING',
                    error_message: null
                };
            } else {
                // Delete Ghost Row (it lost its sheet)
                return null;
            }
        }

        return row;
    });

    // Pass 2: Append (Add New)
    updates.forEach((u, idx) => {
        if (!updatesConsumed.has(idx)) {
            newRoster.push(u);
        }
    });

    // Pass 3: Cleanup (Deduplicate)
    // Identify all sheet_ids strictly claimed by Master rows in the new roster
    const masterSheetIds = new Set(
        newRoster
            .filter(r => r && r.source === 'master' && r.sheet_id)
            .map(r => String(r!.sheet_id))
    );

    // Remove any Ghost rows whose sheet_id is now owned by a Master
    newRoster = newRoster.filter(r => {
        if (!r) return false;
        if (r.source === 'ghost' && r.sheet_id && masterSheetIds.has(String(r.sheet_id))) {
            return false;
        }
        return true;
    });

    return newRoster as RosterEntry[];
}

export const StudentRow = React.memo(({ entry, style, isSelected, isClickable, onSelect, viewMode, fullRoster, classLevel, group, taskId, isOpen, onOpenChange }: StudentRowProps & { isOpen: boolean; onOpenChange: (open: boolean) => void }) => {
    const queryClient = useQueryClient();
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
        try {
            // Calculate 5-digit roll number if sheet_roll is missing
            const finalRoll = calculateStudentRoll(classLevel, group, targetStudent.master_roll || '')
                || targetStudent.sheet_roll
                || targetStudent.master_roll
                || '';

            const updatedRows = await sheetsApi.updateSheetInfo({
                sheet_ids: [entry.sheet_id],
                updates: { student_roll: finalRoll }
            });

            toast.success(`Assigned sheet to ${targetStudent.student_name}`);
            onOpenChange(false);

            queryClient.setQueryData<RosterEntry[]>(['roster', taskId], (oldRoster) => {
                if (!oldRoster) return oldRoster;
                return applyRosterUpdates(oldRoster, updatedRows);
            });
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

            const updatedRows = await sheetsApi.updateSheetInfo({
                sheet_ids: [entry.sheet_id],
                updates: { student_roll: finalRoll }
            });

            toast.success(`Assigned sheet to ${name}`);
            onOpenChange(false);

            queryClient.setQueryData<RosterEntry[]>(['roster', taskId], (oldRoster) => {
                if (!oldRoster) return oldRoster;
                return applyRosterUpdates(oldRoster, updatedRows);
            });
        } catch (error) {
            toast.error("Failed to update manual assignment");
        }
    };

    const handleQuickAction = async (e: React.MouseEvent, type: 'present' | 'too_few') => {
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

    // Determine errors from effective_flags (priority) or row_status
    // Bit 6 (64): Absent but sheet present -> "Mark Present"
    // Bit 1 (2): Too few answers -> "Too few"
    const hasAbsentError = (entry.effective_flags & 64) > 0 || entry.row_status === 'UNEXPECTED';
    const hasTooFewError = (entry.effective_flags & 2) > 0;

    // ... (imports remain same, maybe add Wrench icon)
    // ... imports moved to top
    // ...

    // ... (logic remains same)

    const isCorrected = (entry.corrected_flags || 0) > 0;
    const correctedTooltip = isCorrected ? `Corrected Flags: ${entry.corrected_flags}` : "";
    // Ideally we would map flags to text, but for now showing raw or simple "Corrected" is good start.
    // User requested "User will know what was corrected", so we should try to map if possible or just generic.
    // Given the prompt "Criteria to change corrected row is as simple as corrected_flags > 0 change color and explain in tooltip."
    // Let's use a simple map if possible, but for MVP just show "Manually Corrected" or similar.

    // Using a grid layout:
    // Col 1: Master Roll (15%)
    // Col 2: Student Roll (15%)
    // Col 3: Student Name (30%)
    // Col 4: Error Message (30%)
    // Col 5: Actions (10%)

    return (
        <div
            style={style}
            className="p-0.5" // Reduced padding wrapper
        >
            <div
                onClick={() => isClickable && onSelect()}
                className={cn(
                    "px-2 py-1 rounded-sm text-base flex items-center transition-colors h-full gap-2", // Increased text-base, reduced py-1
                    getRowStyle(entry.row_status),
                    isSelected ? "bg-blue-100 border-blue-200 ring-1 ring-blue-300" : "hover:bg-slate-100",
                    isCorrected && !isSelected && "bg-purple-50/50 border-l-4 border-l-purple-400", // Corrected theme
                    isClickable ? "cursor-pointer" : "cursor-default",
                    !isClickable && !isSelected && !isCorrected && "border border-transparent"
                )}
            >
                {/* Col 1: Icon + Master Roll */}
                <div className="w-[15%] flex items-center gap-2 overflow-hidden shrink-0">
                    <Tooltip>
                        <TooltipTrigger>
                            {isCorrected ? (
                                <Wrench className="w-4 h-4 text-purple-500" />
                            ) : (
                                getStatusIcon(entry.row_status)
                            )}
                        </TooltipTrigger>
                        <TooltipContent>
                            {isCorrected ? (
                                <p>Corrected (Flags: {entry.corrected_flags})</p>
                            ) : (
                                <p>Status: {entry.row_status}</p>
                            )}
                        </TooltipContent>
                    </Tooltip>
                    <span className="font-mono font-semibold truncate text-slate-700" title={entry.master_roll || ''}>
                        {entry.master_roll || '-'}
                    </span>
                </div>

                {/* Col 2: Student Roll (5 digit) */}
                <div className="w-[15%] flex items-center gap-1 overflow-hidden shrink-0">
                    {entry.sheet_id ? (
                        <Popover open={isOpen} onOpenChange={onOpenChange}>
                            <PopoverTrigger asChild>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onOpenChange(true); setSearch(""); }}
                                    className="hover:bg-black/5 px-1 rounded flex items-center gap-1 transition-colors text-left w-full"
                                >
                                    <span className={cn(
                                        "font-mono text-lg font-bold", // Larger font
                                        entry.sheet_roll !== entry.master_roll ? "text-orange-600" : "text-slate-900"
                                    )}>
                                        {entry.sheet_roll || '-'}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                                {/* ... Command content ... */}
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
                                        {/* Matches ... */}
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
                                                            <span className={cn("text-xs", student.row_status === 'MISSING' ? "text-green-600" : "text-orange-500")}>Status: {student.row_status}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
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
                                                            <span className={cn("text-xs", student.row_status === 'MISSING' ? "text-green-600" : "text-orange-500")}>Status: {student.row_status}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
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
                                                            <span className={cn("text-xs", student.row_status === 'MISSING' ? "text-green-600" : "text-orange-500")}>Status: {student.row_status}</span>
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
                        <span className="font-mono text-slate-400">-</span>
                    )}
                </div>

                {/* Col 3: Student Name */}
                <div className="w-[30%] overflow-hidden shrink-0">
                    <span className={cn(
                        "truncate block font-medium text-lg", // Larger font
                        entry.row_status === 'GHOST' ? "text-slate-500 italic" : "text-slate-800"
                    )} title={entry.student_name}>
                        {entry.student_name}
                    </span>
                </div>

                {/* Col 4: Error Message */}
                <div className="w-[30%] overflow-hidden shrink-0">
                    {entry.error_message && (
                        <span className="text-red-500 text-sm truncate block" title={entry.error_message}>
                            {entry.error_message}
                        </span>
                    )}
                </div>

                {/* Col 5: Actions */}
                <div className="flex-1 flex justify-end gap-2 shrink-0 overflow-hidden">
                    {/* Quick Actions */}
                    {hasAbsentError && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs bg-white/50 hover:bg-white text-green-700 border border-green-200 whitespace-nowrap"
                            onClick={(e) => handleQuickAction(e, 'present')}
                        >
                            Confirm Present
                        </Button>
                    )}
                    {hasTooFewError && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs bg-white/50 hover:bg-white text-orange-700 border border-orange-200 whitespace-nowrap"
                            onClick={(e) => handleQuickAction(e, 'too_few')}
                        >
                            Accept
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
});

StudentRow.displayName = 'StudentRow';
