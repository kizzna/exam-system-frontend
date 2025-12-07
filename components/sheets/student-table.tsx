import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { tasksApi } from '@/lib/api/tasks';
import { Loader2, ArrowUpDown, ListOrdered } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { StudentRow } from './student-row';

interface StudentTableProps {
    taskId: string;
    selectedSheetId?: string;
    onSelectSheet: (id: string) => void;
}

type ViewMode = 'PRIORITY' | 'SEQUENTIAL';

export function StudentTable({ taskId, selectedSheetId, onSelectSheet }: StudentTableProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('SEQUENTIAL');

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
            // Note: We need accurate original_filename. 
            // If it's missing, we fall back to something stable but ideally it should present.
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
        estimateSize: () => 60, // Increased slightly for better spacing/UI
        overscan: 5,
    });

    // Keyboard Navigation
    useEffect(() => {
        if (displayRoster.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if no input/textarea is focused
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

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
                case 'n': // Next Error Navigation
                case 'N':
                    if (viewMode === 'SEQUENTIAL') {
                        e.preventDefault();
                        const errorIndex = displayRoster.findIndex((r, idx) => {
                            if (idx <= currentIndex) return false;
                            // Skip OK and MISSING (though missing shouldn't be here in seq view usually)
                            // Stop at ERROR, GHOST, UNEXPECTED, ABSENT
                            return ['ERROR', 'GHOST', 'UNEXPECTED', 'ABSENT'].includes(r.row_status);
                        });
                        if (errorIndex !== -1) {
                            nextIndex = errorIndex;
                        } else {
                            // Optional: Loop back to start or notify "No more errors"
                            // For now, simple stop.
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
    }, [displayRoster, selectedSheetId, onSelectSheet, rowVirtualizer, viewMode]);

    // Scroll to selected item on initial load or selection change (if visible in current view)
    useEffect(() => {
        if (selectedSheetId && displayRoster.length > 0) {
            // We only auto-scroll if the selected item is actually in the current list
            const index = displayRoster.findIndex(r => r.sheet_id === selectedSheetId);
            if (index !== -1) {
                // Optional: Debounce this or check if already visible to prevent jarring jumps
                rowVirtualizer.scrollToIndex(index, { align: 'center' });
            }
        }
    }, [selectedSheetId, displayRoster, rowVirtualizer]); // Removed roster dependency to avoid conflict

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

    // Extract Class and Group from Task ID (8 digits)
    // Structure: [ExamCenter:6][Class:1][Group:1]
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
                                />
                            );
                        })}
                    </TooltipProvider>
                </div>
            </div>
        </div>
    );
}
