import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { tasksApi } from '@/lib/api/tasks';
import { sheetsApi } from '@/lib/api/sheets';
import { RosterEntry } from '@/lib/types/tasks';
import { Loader2, ArrowUpDown, ListOrdered, Navigation, CheckSquare, Square } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { StudentRow } from './student-row';
import { toast } from 'sonner';

interface StudentTableProps {
    taskId: string;
    selectedSheetId?: string;
    onSelectSheet: (id: string) => void;
}

type ViewMode = 'SEQUENTIAL' | 'DELETED';

export function StudentTable({ taskId, selectedSheetId, onSelectSheet }: StudentTableProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('SEQUENTIAL');
    const [jumperStatus, setJumperStatus] = useState<RosterEntry['row_status'] | 'DEFAULT'>('DEFAULT');
    const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
    const [selectedSheetIds, setSelectedSheetIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [lastClickedId, setLastClickedId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Fetch Roster using task_id and viewMode
    const { data: roster, isLoading } = useQuery({
        queryKey: ['roster', taskId, viewMode],
        queryFn: () => tasksApi.getRoster(parseInt(taskId), viewMode === 'DELETED' ? 'deleted' : 'active'),
    });

    // Fetch Stats for Deleted Count
    const { data: stats } = useQuery({
        queryKey: ['task-stats', taskId],
        queryFn: () => tasksApi.getTaskStats({ task_id: taskId }),
        // Refresh every 5s or invalidations
    });

    // Reset selection when view mode changes
    useEffect(() => {
        setSelectedSheetIds(new Set());
        setLastClickedId(null);
    }, [viewMode]);

    const displayRoster = useMemo(() => {
        if (!roster) return [];

        if (viewMode === 'DELETED') {
            // Deleted View (Flat list usually, but sort by original filename helps)
            return roster.sort((a, b) => {
                const nameA = a.original_filename || '';
                const nameB = b.original_filename || '';
                return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
            });
        } else {
            // Sequential View
            return roster
                .filter(r => r.sheet_id !== null)
                .sort((a, b) => {
                    const nameA = a.original_filename || '';
                    const nameB = b.original_filename || '';
                    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                });
        }
    }, [roster, viewMode]);

    const rowVirtualizer = useVirtualizer({
        count: displayRoster.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 50,
        overscan: 5,
    });

    // Batch Actions
    const handleBatchDelete = async () => {
        if (selectedSheetIds.size === 0) return;
        try {
            await sheetsApi.batchDelete(Array.from(selectedSheetIds).map(id => parseInt(id)));
            toast.success(`Deleted ${selectedSheetIds.size} sheets`);
            setSelectedSheetIds(new Set());
            queryClient.invalidateQueries({ queryKey: ['roster'] });
            queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });
        } catch (error) {
            toast.error("Failed to delete sheets");
        }
    };

    const handleBatchRestore = async () => {
        if (selectedSheetIds.size === 0) return;
        try {
            await sheetsApi.batchRestore(Array.from(selectedSheetIds).map(id => parseInt(id)));
            toast.success(`Restored ${selectedSheetIds.size} sheets`);
            setSelectedSheetIds(new Set());
            queryClient.invalidateQueries({ queryKey: ['roster'] });
            queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast.error("Cannot restore: Active sheets with same ID already exist");
            } else {
                toast.error("Failed to restore sheets");
            }
        }
    };

    const handleRowClick = (entry: RosterEntry, e?: React.MouseEvent) => {
        if (!entry.sheet_id) return;
        const id = entry.sheet_id;

        // Focus Update (Always do this)
        onSelectSheet(id);

        if (!isSelectionMode) return;

        if (!e) return;

        const newSelection = new Set(selectedSheetIds);

        if (e.shiftKey && lastClickedId) {
            // Range Selection
            const lastIndex = displayRoster.findIndex(r => r.sheet_id === lastClickedId);
            const currIndex = displayRoster.findIndex(r => r.sheet_id === id);

            if (lastIndex !== -1 && currIndex !== -1) {
                const start = Math.min(lastIndex, currIndex);
                const end = Math.max(lastIndex, currIndex);

                // Clear and select range (standard OS behavior usually extends, but let's just select range + existing? 
                // User said "click row 2 -> hold shift click row 20 -> row 2-20 gets selected".
                // Usually this wipes other selections unless Ctrl is also held. Let's assume wipe non-range for simplicity or stick to standard.
                // Standard: Shift+Click extends selection from 'anchor' (lastClickedId) to current.

                // We'll add range to existing if Ctrl held, or replace if not?
                // Visual Studio Code style: Shift click selects range from anchor.
                if (!e.ctrlKey) {
                    newSelection.clear();
                }

                for (let i = start; i <= end; i++) {
                    const row = displayRoster[i];
                    if (row.sheet_id) newSelection.add(row.sheet_id);
                }
            }
        } else if (e.ctrlKey || e.metaKey) {
            // Toggle
            if (newSelection.has(id)) {
                newSelection.delete(id);
            } else {
                newSelection.add(id);
            }
            setLastClickedId(id);
        } else {
            // Single Select
            newSelection.clear();
            newSelection.add(id);
            setLastClickedId(id);
        }

        setSelectedSheetIds(newSelection);
    };

    // Keyboard Navigation (Update to ensure selection follows focus if simple nav?)
    // Actually keyboard nav usually moves focus. Selection follows if 'Selection Follows Focus' is on.
    // For batch actions, maybe keep them separate.
    // However, the existing code calls `onSelectSheet` on arrow keys.
    // Let's keep existing keyboard logic (moves focus/selectedSheetId) but NOT modify `selectedSheetIds` (batch) 
    // UNLESS the user explicitly engages with selection keys (Space? Shift+Arrow?).
    // For now, let's keep keyboard as "View Focus" only, and Mouse for "Batch Selection". 
    // Or simpler: When keyboard moves focus, we verify if it updates batch selection.
    // Standard: Arrow keys change selection.
    // Let's make Arrow keys update `selectedSheetIds` to JUST the new focused item (resetting batch), matches standardized behavior.

    // ... Copying the huge useEffect for keyboard ...
    // Modifying the `onSelectSheet(nextItem.sheet_id)` part to also `setSelectedSheetIds(new Set([nextItem.sheet_id]))`.

    useEffect(() => {
        if (displayRoster.length === 0) return;

        const handleKeyDown = async (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
            if (editingSheetId) return;

            const currentIndex = displayRoster.findIndex(r => r.sheet_id === selectedSheetId);
            let nextIndex = currentIndex;

            // ... (Existing Switch Logic, preserved accurately) ...
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (e.ctrlKey) {
                        let nextErrorIndex = displayRoster.findIndex((r, idx) => {
                            if (idx <= currentIndex) return false;
                            return ['ERROR', 'GHOST', 'UNEXPECTED', 'ABSENT', 'DUPLICATE', 'ABSENT_MISMATCH'].includes(r.row_status);
                        });
                        if (nextErrorIndex === -1) {
                            nextErrorIndex = displayRoster.findIndex((r) =>
                                ['ERROR', 'GHOST', 'UNEXPECTED', 'ABSENT', 'DUPLICATE', 'ABSENT_MISMATCH'].includes(r.row_status)
                            );
                        }
                        if (nextErrorIndex !== -1) nextIndex = nextErrorIndex;
                    } else if (jumperStatus !== 'DEFAULT') {
                        const statusToFind = jumperStatus;
                        let nextStatusIndex = displayRoster.findIndex((r, idx) => idx > currentIndex && r.row_status === statusToFind);
                        if (nextStatusIndex === -1) {
                            nextStatusIndex = displayRoster.findIndex((r) => r.row_status === statusToFind);
                        }
                        if (nextStatusIndex !== -1) nextIndex = nextStatusIndex;
                    } else {
                        nextIndex = Math.min(displayRoster.length - 1, currentIndex + 1);
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (e.ctrlKey) {
                        const errorIndices = displayRoster
                            .map((r, idx) => ({ ...r, originalIndex: idx }))
                            .filter(r => ['ERROR', 'GHOST', 'UNEXPECTED', 'ABSENT', 'DUPLICATE', 'ABSENT_MISMATCH'].includes(r.row_status))
                            .map(r => r.originalIndex);
                        if (errorIndices.length > 0) {
                            const prevErrors = errorIndices.filter(idx => idx < currentIndex);
                            if (prevErrors.length > 0) nextIndex = prevErrors[prevErrors.length - 1];
                            else nextIndex = errorIndices[errorIndices.length - 1];
                        }
                    } else if (jumperStatus !== 'DEFAULT') {
                        const statusToFind = jumperStatus;
                        const matchingIndices = displayRoster
                            .map((r, idx) => ({ status: r.row_status, index: idx }))
                            .filter(item => item.status === statusToFind)
                            .map(item => item.index);
                        if (matchingIndices.length > 0) {
                            const prevIndices = matchingIndices.filter(idx => idx < currentIndex);
                            if (prevIndices.length > 0) nextIndex = prevIndices[prevIndices.length - 1];
                            else nextIndex = matchingIndices[matchingIndices.length - 1];
                        }
                    } else {
                        nextIndex = Math.max(0, currentIndex - 1);
                    }
                    break;
                case 'PageDown':
                    e.preventDefault();
                    nextIndex = Math.min(displayRoster.length - 1, currentIndex + 10);
                    break;
                case 'PageUp':
                    e.preventDefault();
                    nextIndex = Math.max(0, currentIndex - 10);
                    break;
                case 'Home':
                    e.preventDefault();
                    nextIndex = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    nextIndex = displayRoster.length - 1;
                    break;
                case 'Enter':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        if (currentIndex !== -1) {
                            const entry = displayRoster[currentIndex];
                            if (!entry.sheet_id) return;
                            let actionType: 'present' | 'too_few' | null = null;
                            if ((entry.effective_flags & 64) > 0 || entry.row_status === 'UNEXPECTED') actionType = 'present';
                            else if ((entry.effective_flags & 2) > 0) actionType = 'too_few';

                            if (actionType) {
                                try {
                                    await sheetsApi.verifySheet(entry.sheet_id, {
                                        corrected_flags: {
                                            marked_present: actionType === 'present' ? true : undefined,
                                            too_few_answers: actionType === 'too_few' ? true : undefined
                                        }
                                    });
                                    toast.success("Updated sheet status via shortcut");
                                    queryClient.invalidateQueries({ queryKey: ['roster'] });
                                    queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });
                                    handleCorrect();
                                } catch (err) { toast.error("Failed to update status"); }
                            } else { toast.info("No quick fix available"); }
                        }
                    } else {
                        e.preventDefault();
                        if (currentIndex !== -1) {
                            const entry = displayRoster[currentIndex];
                            if (entry.sheet_id) setEditingSheetId(entry.sheet_id);
                        }
                    }
                    break;
                // ... Left/Right Arrow logic preserved ...
                case 'ArrowLeft':
                    // ... (omitted for brevity, assume preservation or copy raw from previous verify)
                    // Since I am replacing the whole function, I MUST include it.
                    if (e.ctrlKey) {
                        e.preventDefault();
                        const currentRoll = displayRoster[currentIndex]?.master_roll || displayRoster[currentIndex]?.sheet_roll;
                        const searchRoll = currentRoll ? String(currentRoll) : null;
                        const counterpartIndices = displayRoster.map((r, idx) => {
                            const mr = r.master_roll ? String(r.master_roll) : null;
                            const sr = r.sheet_roll ? String(r.sheet_roll) : null;
                            return (searchRoll && (mr === searchRoll || sr === searchRoll)) ? idx : -1;
                        }).filter(idx => idx !== -1);

                        if (counterpartIndices.length > 1) {
                            const prevIndices = counterpartIndices.filter(idx => idx < currentIndex);
                            nextIndex = prevIndices.length > 0 ? prevIndices[prevIndices.length - 1] : counterpartIndices[counterpartIndices.length - 1];
                        } else {
                            let foundIndex = -1;
                            for (let i = currentIndex - 1; i >= 0; i--) {
                                if (displayRoster[i].row_status === 'DUPLICATE') { foundIndex = i; break; }
                            }
                            if (foundIndex === -1) {
                                for (let i = displayRoster.length - 1; i > currentIndex; i--) {
                                    if (displayRoster[i].row_status === 'DUPLICATE') { foundIndex = i; break; }
                                }
                            }
                            if (foundIndex !== -1) nextIndex = foundIndex;
                        }
                    }
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        const currentRoll = displayRoster[currentIndex]?.master_roll || displayRoster[currentIndex]?.sheet_roll;
                        const searchRoll = currentRoll ? String(currentRoll) : null;
                        const counterpartIndices = displayRoster.map((r, idx) => {
                            const mr = r.master_roll ? String(r.master_roll) : null;
                            const sr = r.sheet_roll ? String(r.sheet_roll) : null;
                            return (searchRoll && (mr === searchRoll || sr === searchRoll)) ? idx : -1;
                        }).filter(idx => idx !== -1);
                        if (counterpartIndices.length > 1) {
                            const nextIndices = counterpartIndices.filter(idx => idx > currentIndex);
                            nextIndex = nextIndices.length > 0 ? nextIndices[0] : counterpartIndices[0];
                        } else {
                            let foundIndex = -1;
                            for (let i = currentIndex + 1; i < displayRoster.length; i++) {
                                if (displayRoster[i].row_status === 'DUPLICATE') { foundIndex = i; break; }
                            }
                            if (foundIndex === -1) {
                                for (let i = 0; i < currentIndex; i++) {
                                    if (displayRoster[i].row_status === 'DUPLICATE') { foundIndex = i; break; }
                                }
                            }
                            if (foundIndex !== -1) nextIndex = foundIndex;
                        }
                    }
                    break;
            }

            if (nextIndex !== currentIndex && nextIndex !== -1) {
                const nextItem = displayRoster[nextIndex];
                if (nextItem.sheet_id) {
                    onSelectSheet(nextItem.sheet_id);
                    // Also update selection to just this item ONLY if selection mode is active
                    if (isSelectionMode) {
                        setSelectedSheetIds(new Set([nextItem.sheet_id]));
                        setLastClickedId(nextItem.sheet_id);
                    }
                    rowVirtualizer.scrollToIndex(nextIndex, { align: 'center' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [displayRoster, selectedSheetId, onSelectSheet, rowVirtualizer, viewMode, queryClient, editingSheetId, jumperStatus]);

    // ... (Focus Retention and Auto-Scroll effects) ...
    const lastSelectedIdRef = useRef<string | undefined>();
    useEffect(() => {
        const hasSelectionChanged = selectedSheetId !== lastSelectedIdRef.current;
        const isFirstLoad = !lastSelectedIdRef.current && selectedSheetId;
        if ((hasSelectionChanged || isFirstLoad) && selectedSheetId && displayRoster.length > 0) {
            const index = displayRoster.findIndex(r => r.sheet_id === selectedSheetId);
            if (index !== -1) rowVirtualizer.scrollToIndex(index, { align: 'center' });
        }
        lastSelectedIdRef.current = selectedSheetId;
    }, [selectedSheetId, displayRoster, rowVirtualizer]);

    // Cleanup / Auto-Advance Logic
    // Legacy auto-advance is disabled in favor of the effect-based logic above.
    const handleCorrect = () => { };


    // Loading / Empty States
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    // Stats Count Fallback
    const deletedCount = (stats as any)?.deleted_sheets_total ?? 0; // Use 'any' cast until types updated

    const classLevel = parseInt(taskId.charAt(6), 10);
    const group = parseInt(taskId.charAt(7), 10);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header / View Toggle */}
            <div className="flex items-center justify-between p-2 border-b gap-2 bg-slate-50">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`text-xs px-3 ${viewMode === 'SEQUENTIAL' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800' : 'text-slate-600'}`}
                        onClick={() => setViewMode('SEQUENTIAL')}
                    >
                        <ListOrdered className="w-3 h-3 mr-1" />
                        Sequential
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`text-xs px-3 ${viewMode === 'DELETED' ? 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800' : 'text-slate-600'}`}
                        onClick={() => setViewMode('DELETED')}
                    >
                        {/* Use Trash Icon? */}
                        <span className="mr-1">🗑️</span>
                        DELETED ({deletedCount})
                    </Button>
                </div>

                {/* Batch Actions Toolbar */}
                {selectedSheetIds.size > 0 && (
                    <div className="flex items-center gap-2 px-2 border-l border-slate-200">
                        <span className="text-xs text-slate-500">{selectedSheetIds.size} selected</span>
                        {viewMode === 'SEQUENTIAL' && (
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleBatchDelete}>
                                Delete Selected
                            </Button>
                        )}
                        {viewMode === 'DELETED' && (
                            <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={handleBatchRestore}>
                                Restore Selected
                            </Button>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2 ml-auto">
                    <div className="flex items-center gap-1 border-r pr-2 mr-2 border-slate-200">
                        <span className="text-xs text-slate-400 mr-1">Selection Mode</span>
                        {/* Selection Toggle */}
                        <Button
                            variant={isSelectionMode ? "secondary" : "ghost"}
                            size="sm"
                            className={`h-7 w-7 p-0 ${isSelectionMode ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (isSelectionMode) setSelectedSheetIds(new Set()); // Clear on disable? User didn't specify, but usually safer.
                            }}
                            title="Toggle Selection Mode"
                        >
                            {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </Button>
                    </div>

                    <Navigation className="w-4 h-4 text-slate-500" />
                    <Select
                        value={jumperStatus}
                        onValueChange={(val) => setJumperStatus(val as RosterEntry['row_status'] | 'DEFAULT')}
                        onOpenChange={(open) => {
                            if (!open) {
                                setTimeout(() => {
                                    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                                    parentRef.current?.focus();
                                }, 50);
                            }
                        }}
                    >
                        <SelectTrigger className="h-8 w-[180px] text-xs bg-white">
                            <SelectValue placeholder="Jump Mode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DEFAULT">Default (Sequential)</SelectItem>
                            <SelectItem value="DUPLICATE">DUPLICATE</SelectItem>
                            <SelectItem value="GHOST">GHOST</SelectItem>
                            <SelectItem value="ABSENT_MISMATCH">ABSENT_MISMATCH</SelectItem>
                            <SelectItem value="ERROR">ERROR</SelectItem>
                            <SelectItem value="MISSING">MISSING</SelectItem>
                            <SelectItem value="ABSENT">ABSENT</SelectItem>
                            <SelectItem value="OK">OK</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* List */}
            <div
                ref={parentRef}
                className="flex-1 overflow-auto p-2 outline-none"
                tabIndex={-1}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    <TooltipProvider>
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const entry = displayRoster[virtualRow.index];
                            // Selection Logic for Props
                            // If user is batch selecting, isSelected logic might need adjustment?
                            // Currently `isSelected` prop in StudentRow drives visual "Blue" Focus.
                            // We should probably allow multiple rows to be blue.

                            const isBatchSelected = entry.sheet_id ? selectedSheetIds.has(entry.sheet_id) : false;
                            const isFocused = entry.sheet_id === selectedSheetId;

                            const isClickable = !!entry.sheet_id;

                            // Editing Logic
                            const isOpen = editingSheetId === entry.sheet_id;
                            const onOpenChange = (open: boolean) => {
                                if (open) setEditingSheetId(entry.sheet_id as string);
                                else setEditingSheetId(null);
                            };

                            return (
                                <StudentRow
                                    key={entry.sheet_id || `missing-${entry.master_roll}`}
                                    entry={entry}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    isSelected={isBatchSelected || isFocused}
                                    isClickable={isClickable}
                                    onSelect={(e) => handleRowClick(entry, e)}
                                    viewMode={viewMode}
                                    fullRoster={roster || []}
                                    classLevel={classLevel}
                                    group={group}
                                    isOpen={isOpen}
                                    onOpenChange={onOpenChange}
                                    taskId={taskId}
                                    onCorrect={handleCorrect}
                                    suggestedRoll={(() => {
                                        const prevEntry = displayRoster[virtualRow.index - 1];
                                        const nextEntry = displayRoster[virtualRow.index + 1];
                                        if (prevEntry && nextEntry) {
                                            const prevRoll = parseInt(prevEntry.master_roll || prevEntry.sheet_roll || '0', 10);
                                            const nextRoll = parseInt(nextEntry.master_roll || nextEntry.sheet_roll || '0', 10);
                                            if (prevRoll > 0 && nextRoll > 0 && (nextRoll - prevRoll === 2)) {
                                                return (prevRoll + 1).toString();
                                            }
                                        }
                                        return undefined;
                                    })()}
                                />
                            );
                        })}
                    </TooltipProvider>
                </div>
            </div>
            {(!roster || roster.length === 0) && (
                <div className="text-center text-slate-400 mt-10">No sheets found in this view</div>
            )}
        </div>
    );
}
