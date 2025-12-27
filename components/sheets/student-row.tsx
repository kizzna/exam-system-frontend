import React, { useState } from 'react';
import { RosterEntry } from '@/lib/types/tasks';
import { cn, calculateStudentRoll } from '@/lib/utils';
import { getThaiRowStatus } from '@/lib/translations';
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
    onSelect: (e?: React.MouseEvent) => void;
    viewMode: 'SEQUENTIAL' | 'DELETED' | 'MISSING';
    fullRoster: RosterEntry[];
    classLevel: number;
    group: number;
    taskId: string;
    onCorrect?: () => void;
    isBatchSelected: boolean;
    isFinalized?: boolean;
}

// ... (helper functions)

// Helper to apply updates to roster
const applyRosterUpdates = (currentRoster: RosterEntry[], updates: RosterEntry[]) => {
    if (!updates || updates.length === 0) return currentRoster;
    return currentRoster.map(row => {
        const update = updates.find(u => u.sheet_id === row.sheet_id);
        if (update) {
            return { ...row, ...update };
        }
        return row;
    });
};

export const StudentRow = React.memo(({ entry, style, isSelected, isClickable, onSelect, viewMode, fullRoster, classLevel, group, taskId, isOpen, onOpenChange, onCorrect, isBatchSelected, prevMasterRoll, nextMasterRoll, isFinalized }: StudentRowProps & { isOpen: boolean; onOpenChange: (open: boolean) => void; prevMasterRoll?: number; nextMasterRoll?: number }) => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const listRef = React.useRef<HTMLDivElement>(null);

    // Reset scroll when search changes
    React.useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = 0;
        }
    }, [search]);

    const { exactMatches, startsWithMatches, otherMatches, suggestedMatches } = React.useMemo(() => {
        // Filter out GHOST from search results as requested
        const filterGhost = (r: RosterEntry) => r.row_status !== 'GHOST';

        const empty = { exactMatches: [], startsWithMatches: [], otherMatches: [], suggestedMatches: [] };

        // Define suggestions array in the outer scope
        let suggestions: RosterEntry[] = [];

        if (!search) {
            // Default View: Smart Suggestions + Top 50 non-ghosts

            // Level 1: Gap Fill (Exact middle)
            // e.g. Prev=10, Next=12 -> Suggest 11
            if (prevMasterRoll && nextMasterRoll && (nextMasterRoll - prevMasterRoll === 2)) {
                const targetRoll = prevMasterRoll + 1;
                const target = fullRoster.find(r =>
                    r.row_status === 'MISSING' &&
                    parseInt(r.master_roll || '0', 10) === targetRoll
                );
                if (target) suggestions.push(target);
            }

            // Level 2: Neighborhood (Same Decade)
            // e.g. Prev=157, Next=160 -> Suggest 150-159 range (MISSING only)
            const prevDecade = prevMasterRoll ? Math.floor(prevMasterRoll / 10) : undefined;
            const nextDecade = nextMasterRoll ? Math.floor(nextMasterRoll / 10) : undefined;

            // We want to find MISSING students that are in the same decade as neighbors
            // But we exclude what is already in Level 1
            const level2Candidates = fullRoster.filter(r => {
                if (r.row_status !== 'MISSING') return false;
                if (suggestions.some(s => s === r)) return false; // Already suggested

                const rRoll = parseInt(r.master_roll || '0', 10);
                const rDecade = Math.floor(rRoll / 10);

                // Check if in neighbor decades
                if (prevDecade !== undefined && rDecade === prevDecade) return true;
                if (nextDecade !== undefined && rDecade === nextDecade) return true;

                return false;
            }).sort((a, b) => {
                const ra = parseInt(a.master_roll || '0', 10);
                const rb = parseInt(b.master_roll || '0', 10);
                return ra - rb;
            });

            suggestions = [...suggestions, ...level2Candidates];

            // Level 3: existing logic for others (excluding suggested)
            const others = fullRoster
                .filter(r => filterGhost(r) && (!suggestions.length || !suggestions.includes(r)))
                .slice(0, 50);

            return { ...empty, suggestedMatches: suggestions, otherMatches: others };
        }

        const searchTrimmed = search.trim();
        const searchLower = searchTrimmed.toLowerCase();

        let exact: RosterEntry[] = [];
        let starts: RosterEntry[] = [];
        let others: RosterEntry[] = [];

        const searchNum = parseInt(searchTrimmed, 10);
        const isSearchNumeric = !isNaN(searchNum);

        // Convert search to 5-digit roll if numeric
        let searchRollCalculated = '';
        if (isSearchNumeric) {
            searchRollCalculated = calculateStudentRoll(classLevel, group, searchTrimmed) || '';
            // console.log('calculatedRoll ' + searchRollCalculated);
        }

        fullRoster.forEach(s => {
            const masterRollStr = s.master_roll ? s.master_roll.toString() : '';
            const sheetRollStr = s.sheet_roll ? s.sheet_roll.toString() : '';
            const nameLower = s.student_name ? s.student_name.toLowerCase() : '';

            // Calculate candidate's 5-digit roll for comparison
            const candidateMasterRollCalculated = calculateStudentRoll(classLevel, group, masterRollStr) || masterRollStr;
            const candidateSheetRollCalculated = calculateStudentRoll(classLevel, group, sheetRollStr) || sheetRollStr;

            // 1. Exact Match Logic
            if (isSearchNumeric) {
                // Check if candidate's master roll (calculated or raw) matches the search roll (calculated or raw)
                if (candidateMasterRollCalculated === searchRollCalculated || masterRollStr === searchTrimmed) {
                    exact.push(s);
                    return;
                }
                // Check if candidate's sheet roll (calculated or raw) matches the search roll (calculated or raw)
                if (candidateSheetRollCalculated === searchRollCalculated || sheetRollStr === searchTrimmed) {
                    exact.push(s);
                    return;
                }
            } else {
                // Partial match for names
                if (s.student_name && s.student_name.includes(searchTrimmed)) {
                    exact.push(s);
                    return;
                }
            }

            // 2. Starts With
            if (masterRollStr.startsWith(searchTrimmed) || sheetRollStr.startsWith(searchTrimmed)) {
                starts.push(s);
                return;
            }

            // 3. Others
            if (masterRollStr.includes(searchTrimmed) || sheetRollStr.includes(searchTrimmed) || nameLower.includes(searchLower)) {
                others.push(s);
            }
        });

        const sortNumeric = (a: RosterEntry, b: RosterEntry) => {
            // Priority: MISSING status first
            if (a.row_status === 'MISSING' && b.row_status !== 'MISSING') return -1;
            if (a.row_status !== 'MISSING' && b.row_status === 'MISSING') return 1;

            const ra = parseInt(a.master_roll?.toString() || '0', 10);
            const rb = parseInt(b.master_roll?.toString() || '0', 10);
            return ra - rb;
        };

        exact = exact.filter(filterGhost).sort(sortNumeric);
        starts = starts.filter(filterGhost).sort(sortNumeric);
        others = others.filter(filterGhost).sort(sortNumeric);

        return { exactMatches: exact, startsWithMatches: starts, otherMatches: others, suggestedMatches: [] };
    }, [fullRoster, search, classLevel, group, prevMasterRoll, nextMasterRoll]);

    const getStatusIcon = (status: RosterEntry['row_status']) => {
        switch (status) {
            case 'GHOST': return <Ghost className="w-4 h-4 text-red-500" />;
            case 'ERROR': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            case 'DUPLICATE': return <AlertTriangle className="w-4 h-4 text-red-600" />; // More severe than ERROR
            case 'ABSENT_MISMATCH': return <UserX className="w-4 h-4 text-red-500" />;
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
            case 'DUPLICATE': return "border-l-4 border-l-red-600 bg-red-100/50";
            case 'ABSENT_MISMATCH': return "border-l-4 border-l-red-500 bg-red-50/50";
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

            queryClient.setQueryData<RosterEntry[]>(['roster', taskId, viewMode], (oldRoster) => {
                if (!oldRoster) return oldRoster;
                return applyRosterUpdates(oldRoster, updatedRows);
            });

            // Invalidate for refresh
            queryClient.invalidateQueries({ queryKey: ['sheet-overlay', entry.sheet_id] });
            queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });

            if (onCorrect) onCorrect();

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

            queryClient.setQueryData<RosterEntry[]>(['roster', taskId, viewMode], (oldRoster) => {
                if (!oldRoster) return oldRoster;
                return applyRosterUpdates(oldRoster, updatedRows);
            });

            // Invalidate for refresh
            queryClient.invalidateQueries({ queryKey: ['sheet-overlay', entry.sheet_id] });
            queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });

            if (onCorrect) onCorrect();

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

            // Invalidate for refresh
            queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });
            // Overlay won't change on quick action flags usually, but harmless to verify
            // queryClient.invalidateQueries({ queryKey: ['sheet-overlay', entry.sheet_id] });

            if (onCorrect) onCorrect();

        } catch (error) {
            toast.error("Failed to update status");
        }
    }

    // Determine errors from effective_flags (priority) or row_status
    // Bit 6 (64): Absent but sheet present -> "Mark Present"
    // Bit 1 (2): Too few answers -> "Too few"
    const hasAbsentError = (entry.effective_flags & 64) > 0 || entry.row_status === 'UNEXPECTED' || entry.row_status === 'ABSENT_MISMATCH';
    const hasTooFewError = (entry.effective_flags & 2) > 0;

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
                onClick={(e) => isClickable && !isFinalized && onSelect(e)} // Disable checking
                className={cn(
                    "px-2 py-1 rounded-sm text-base flex items-center transition-colors h-full gap-2", // Increased text-base, reduced py-1
                    getRowStyle(entry.row_status),
                    isSelected ? "bg-blue-100 border-blue-200 ring-1 ring-blue-300" : "hover:bg-slate-100",
                    isCorrected && !isSelected && "bg-purple-50/50 border-l-4 border-l-purple-400", // Corrected theme
                    (isClickable && !isFinalized) ? "cursor-pointer" : "cursor-default",
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
                                <p>Status: {getThaiRowStatus(entry.row_status)}</p>
                            )}
                        </TooltipContent>
                    </Tooltip>
                    <span className="font-mono font-semibold truncate text-slate-700" title={entry.master_roll || ''}>
                        {entry.master_roll || '-'}
                    </span>
                </div>

                {/* Col 2: Student Roll (5 digit) */}
                <div className="w-[15%] flex items-center gap-1 overflow-hidden shrink-0">
                    {entry.sheet_id && viewMode === 'DELETED' && (
                        <span className={cn(
                            "font-mono text-lg font-bold px-1",
                            "text-slate-400 cursor-not-allowed" // Disabled look
                        )}>
                            {entry.sheet_roll || '-'}
                        </span>
                    )}

                    {entry.sheet_id && viewMode !== 'DELETED' && (
                        <Popover open={isOpen && !isFinalized} onOpenChange={onOpenChange}>
                            <PopoverTrigger asChild>
                                <button
                                    onClick={(e) => { e.stopPropagation(); if (!isFinalized) { onOpenChange(true); setSearch(""); } }}
                                    disabled={isFinalized}
                                    className={cn(
                                        "hover:bg-black/5 px-1 rounded flex items-center gap-1 transition-colors text-left w-full",
                                        isFinalized && "opacity-80 cursor-not-allowed hover:bg-transparent"
                                    )}
                                >
                                    <span className={cn(
                                        "font-mono text-lg font-bold", // Larger font
                                        entry.sheet_roll !== entry.master_roll ? "text-orange-600" : "text-slate-900",
                                        isFinalized && "text-slate-600"
                                    )}>
                                        {entry.sheet_roll || '-'}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0 bg-slate-900/95 border-slate-700 text-slate-100 backdrop-blur-sm" align="start">
                                {/* ... Popover Content ... */}
                                <Command shouldFilter={false} className="bg-transparent text-slate-100">
                                    <CommandInput
                                        placeholder="ใบตอบนี้เป็นของ..."
                                        value={search}
                                        onValueChange={setSearch}
                                        className="text-white placeholder:text-slate-400"
                                        onKeyDown={(e) => {
                                            // Allow native Home/End behavior
                                            if (e.key === 'Home' || e.key === 'End') {
                                                e.stopPropagation();
                                            }
                                        }}
                                    />
                                    <CommandList ref={listRef} className="max-h-[300px] overflow-y-auto">
                                        <CommandEmpty className="py-2 text-center text-sm text-slate-400">No student found.</CommandEmpty>
                                        {/* Manual Input Option */}
                                        {search && !isNaN(parseInt(search)) && (
                                            <CommandItem
                                                value={`manual-${search}`}
                                                onSelect={() => handleManualAssign(search)}
                                                className="aria-selected:bg-emerald-600 aria-selected:text-white data-[disabled]:opacity-90 data-[disabled]:pointer-events-auto cursor-pointer"
                                            >
                                                <span className="font-medium text-blue-400 flex items-center gap-2">
                                                    Assign ID: {search}
                                                    <span className="text-xs text-slate-500 font-normal">
                                                        (→ {calculateStudentRoll(classLevel, group, search)})
                                                    </span>
                                                </span>
                                            </CommandItem>
                                        )}
                                        {/* Suggested Matches */}
                                        {suggestedMatches && suggestedMatches.length > 0 && (
                                            <CommandGroup heading="Suggested Correction" className="text-emerald-400">
                                                {suggestedMatches.map((student, idx) => (
                                                    <CommandItem
                                                        key={`${student.source}-${student.master_roll}-suggested-${idx}`}
                                                        value={`${student.master_roll} ${student.student_name} suggested-${idx}`}
                                                        onSelect={() => handleAssignStudent(student)}
                                                        className="aria-selected:bg-emerald-600 aria-selected:text-white data-[disabled]:opacity-90 data-[disabled]:pointer-events-auto cursor-pointer"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white">น่าจะเป็นของ: {student.student_name} ({student.master_roll})</span>
                                                            <span className={cn("text-xs", student.row_status === 'MISSING' ? "text-green-400" : "text-orange-400")}>
                                                                Status: {getThaiRowStatus(student.row_status)}
                                                            </span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}

                                        {/* Matches */}
                                        {exactMatches.length > 0 && (
                                            <CommandGroup heading="Exact Match" className="text-slate-300">
                                                {exactMatches.map((student, idx) => (
                                                    <CommandItem
                                                        key={`${student.source}-${student.master_roll}-${idx}`}
                                                        value={`${student.master_roll} ${student.student_name} exact-${idx}`}
                                                        onSelect={() => handleAssignStudent(student)}
                                                        className="aria-selected:bg-emerald-600 aria-selected:text-white data-[disabled]:opacity-90 data-[disabled]:pointer-events-auto cursor-pointer"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white">{student.student_name} ({student.master_roll})</span>
                                                            <span className={cn("text-xs", student.row_status === 'MISSING' ? "text-green-400" : "text-orange-400")}>Status: {getThaiRowStatus(student.row_status)}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                        {startsWithMatches.length > 0 && (
                                            <CommandGroup heading="Matches ID" className="text-slate-300">
                                                {startsWithMatches.map((student, idx) => (
                                                    <CommandItem
                                                        key={`${student.source}-${student.master_roll}-${idx}`}
                                                        value={`${student.master_roll} ${student.student_name} starts-${idx}`}
                                                        onSelect={() => handleAssignStudent(student)}
                                                        className="aria-selected:bg-emerald-600 aria-selected:text-white data-[disabled]:opacity-90 data-[disabled]:pointer-events-auto cursor-pointer"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-200">{student.student_name} ({student.master_roll})</span>
                                                            <span className={cn("text-xs", student.row_status === 'MISSING' ? "text-green-400" : "text-orange-400")}>Status: {getThaiRowStatus(student.row_status)}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                        {otherMatches.length > 0 && (
                                            <CommandGroup heading="Other Matches" className="text-slate-300">
                                                {otherMatches.map((student, idx) => (
                                                    <CommandItem
                                                        key={`${student.source}-${student.master_roll}-${idx}`}
                                                        value={`${student.master_roll} ${student.student_name} other-${idx}`}
                                                        onSelect={() => handleAssignStudent(student)}
                                                        className="aria-selected:bg-emerald-600 aria-selected:text-white data-[disabled]:opacity-90 data-[disabled]:pointer-events-auto cursor-pointer"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-200">{student.student_name} ({student.master_roll})</span>
                                                            <span className={cn("text-xs", student.row_status === 'MISSING' ? "text-green-400" : "text-orange-400")}>Status: {getThaiRowStatus(student.row_status)}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    )}

                    {!entry.sheet_id && (
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
                            disabled={isFinalized}
                        >
                            มาสอบจริง
                        </Button>
                    )}
                    {hasTooFewError && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs bg-white/50 hover:bg-white text-orange-700 border border-orange-200 whitespace-nowrap"
                            onClick={(e) => handleQuickAction(e, 'too_few')}
                            disabled={isFinalized}
                        >
                            ไม่ครบจริง
                        </Button>
                    )}

                </div>
            </div>
        </div>
    );
});

StudentRow.displayName = 'StudentRow';
