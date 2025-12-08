import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { tasksApi } from '@/lib/api/tasks';
import { sheetsApi } from '@/lib/api/sheets';
import { Loader2, ArrowUpDown, ListOrdered } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { StudentRow } from './student-row';
import { toast } from 'sonner';

interface StudentTableProps {
    taskId: string;
    selectedSheetId?: string;
    onSelectSheet: (id: string) => void;
}

type ViewMode = 'PRIORITY' | 'SEQUENTIAL';

export function StudentTable({ taskId, selectedSheetId, onSelectSheet }: StudentTableProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('SEQUENTIAL');
    const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Fetch Roster using task_id
    const { data: roster, isLoading } = useQuery({
        queryKey: ['roster', taskId],
        queryFn: () => tasksApi.getRoster(parseInt(taskId)),
    });

    const displayRoster = useMemo(() => {
        if (!roster) return [];

        if (viewMode === 'PRIORITY') {
            return roster; // Default backend sort (Priority)
        } else {
            // Sequential View: 
            // 1. Filter out Missing (No physical sheet)
            // 2. Sort by original_filename (Physical order)
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

    // Keyboard Navigation
    useEffect(() => {
        if (displayRoster.length === 0) return;

        const handleKeyDown = async (e: KeyboardEvent) => {
            // Only handle if no input/textarea is focused
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            // Block navigation if a popover is open
            if (editingSheetId) return;

            const currentIndex = displayRoster.findIndex(r => r.sheet_id === selectedSheetId);
            let nextIndex = currentIndex;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    nextIndex = Math.min(displayRoster.length - 1, currentIndex + 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    nextIndex = Math.max(0, currentIndex - 1);
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
                        // Quick Fix (Ctrl + Enter)
                        e.preventDefault();
                        if (currentIndex !== -1) {
                            const entry = displayRoster[currentIndex];
                            if (!entry.sheet_id) return;

                            // Determine Action based on effective_flags
                            // Bit 6 (64): Absent but sheet present -> Mark Present
                            // Bit 1 (2): Too few answers -> Too few
                            // Prioritize Mark Present if both exist (though unlikely)
                            let actionType: 'present' | 'too_few' | null = null;
                            if ((entry.effective_flags & 64) > 0 || entry.row_status === 'UNEXPECTED') {
                                actionType = 'present';
                            } else if ((entry.effective_flags & 2) > 0) {
                                actionType = 'too_few';
                            }

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

                                    // Trigger Auto-Advance for Quick Fix
                                    handleCorrect();
                                } catch (err) {
                                    toast.error("Failed to update status");
                                }
                            } else {
                                toast.info("No quick fix available for this status");
                            }
                        }
                    } else {
                        // Edit Mode (Enter)
                        e.preventDefault();
                        if (currentIndex !== -1) {
                            const entry = displayRoster[currentIndex];
                            // Only allow edit if there is a sheet_id
                            if (entry.sheet_id) {
                                setEditingSheetId(entry.sheet_id);
                            }
                        }
                    }
                    break;
                case 'n': // Next Error Navigation
                case 'N':
                    e.preventDefault();
                    // Find next error starting from currentIndex + 1
                    let nextErrorIndex = displayRoster.findIndex((r, idx) => {
                        if (idx <= currentIndex) return false;
                        return ['ERROR', 'GHOST', 'UNEXPECTED', 'ABSENT'].includes(r.row_status);
                    });

                    // Logic: If current row is already at last (or no next error found), wrap to first error
                    if (nextErrorIndex === -1) {
                        nextErrorIndex = displayRoster.findIndex((r) =>
                            ['ERROR', 'GHOST', 'UNEXPECTED', 'ABSENT'].includes(r.row_status)
                        );
                    }

                    if (nextErrorIndex !== -1) {
                        nextIndex = nextErrorIndex;
                    }
                    break;
                case 'p': // Previous Error Navigation
                case 'P':
                    e.preventDefault();
                    // Find prev error starting from currentIndex - 1 traversing backwards
                    // or just find all errors and pick the one before current
                    const errorIndices = displayRoster
                        .map((r, idx) => ({ ...r, originalIndex: idx }))
                        .filter(r => ['ERROR', 'GHOST', 'UNEXPECTED', 'ABSENT'].includes(r.row_status))
                        .map(r => r.originalIndex);

                    if (errorIndices.length > 0) {
                        // Find first index < currentIndex
                        const prevErrors = errorIndices.filter(idx => idx < currentIndex);
                        if (prevErrors.length > 0) {
                            nextIndex = prevErrors[prevErrors.length - 1];
                        } else {
                            // Wrap to last
                            nextIndex = errorIndices[errorIndices.length - 1];
                        }
                    }
                    break;
                default:
                    return;
            }

            if (nextIndex !== currentIndex && nextIndex !== -1) {
                const nextItem = displayRoster[nextIndex];
                if (nextItem.sheet_id) {
                    onSelectSheet(nextItem.sheet_id);
                    rowVirtualizer.scrollToIndex(nextIndex, { align: 'center' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [displayRoster, selectedSheetId, onSelectSheet, rowVirtualizer, viewMode, queryClient, editingSheetId]);

    // Cleanup / Auto-Advance Logic
    const handleCorrect = () => {
        // Doc: "Current row become next sheet with error unless there is no sheet with error"
        // User Update (V3): "I think we need to disable this one because user should see the reflection..."
        // Disable auto-advance. Selection stays on the current row.

        // No-op.
    };

    // Scroll to selected item on initial load or selection change (if visible in current view)
    useEffect(() => {
        if (selectedSheetId && displayRoster.length > 0) {
            const index = displayRoster.findIndex(r => r.sheet_id === selectedSheetId);
            if (index !== -1) {
                rowVirtualizer.scrollToIndex(index, { align: 'center' });
            }
        }
    }, [selectedSheetId, displayRoster, rowVirtualizer]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!roster || roster.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No students found
            </div>
        );
    }

    const classLevel = parseInt(taskId.charAt(6), 10);
    const group = parseInt(taskId.charAt(7), 10);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header / View Toggle */}
            <div className="flex items-center gap-1 p-2 border-b">
                <Button
                    variant={viewMode === 'PRIORITY' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setViewMode('PRIORITY')}
                >
                    <ArrowUpDown className="w-3 h-3 mr-1" />
                    Priority
                </Button>
                <Button
                    variant={viewMode === 'SEQUENTIAL' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setViewMode('SEQUENTIAL')}
                >
                    <ListOrdered className="w-3 h-3 mr-1" />
                    Sequential
                </Button>
            </div>

            {/* List */}
            <div ref={parentRef} className="flex-1 overflow-auto p-2">
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
                            const isSelected = entry.sheet_id === selectedSheetId;
                            const isClickable = !!entry.sheet_id;

                            // Editing Logic
                            const isOpen = editingSheetId === entry.sheet_id;
                            const onOpenChange = (open: boolean) => {
                                if (open) {
                                    setEditingSheetId(entry.sheet_id);
                                } else {
                                    setEditingSheetId(null);
                                }
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
                                    isSelected={isSelected}
                                    isClickable={isClickable}
                                    onSelect={() => entry.sheet_id && onSelectSheet(entry.sheet_id)}
                                    viewMode={viewMode}
                                    fullRoster={roster}
                                    classLevel={classLevel}
                                    group={group}
                                    isOpen={isOpen}
                                    onOpenChange={onOpenChange}
                                    taskId={taskId}
                                    onCorrect={handleCorrect}
                                />
                            );
                        })}
                    </TooltipProvider>
                </div>
            </div>
        </div>
    );
}
