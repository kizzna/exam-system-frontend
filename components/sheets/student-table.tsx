import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { tasksApi } from '@/lib/api/tasks';
import { sheetsApi } from '@/lib/api/sheets';
import { RosterEntry } from '@/lib/types/tasks';
import { ROW_STATUS_TRANSLATIONS } from '@/lib/translations';
import { Loader2, ListOrdered, CheckSquare, Square, UserX, ArrowRightToLine, ArrowLeftRight, AlertTriangle, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ReprocessTaskStream } from './reprocess-task-stream';
import { getProfiles } from '@/lib/api/profiles';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TaskSearchPopover } from '@/components/tasks/task-search-popover';
import { Task } from '@/lib/types/tasks';

import { Button } from '@/components/ui/button';
import { StudentRow } from './student-row';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ImageUploadForm } from '@/components/batches/ImageUploadForm';
import { AlertCircle, CloudUpload } from 'lucide-react';

interface StudentTableProps {
    taskId: string;
    selectedSheetId?: string;
    onSelectSheet: (id: string | undefined) => void;
}

type ViewMode = 'SEQUENTIAL' | 'DELETED' | 'MISSING';

export function StudentTable({ taskId, selectedSheetId, onSelectSheet }: StudentTableProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('SEQUENTIAL');
    // Jumper status removed
    const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
    const [selectedSheetIds, setSelectedSheetIds] = useState<Set<string>>(new Set());
    // isSelectionMode removed
    const [lastClickedId, setLastClickedId] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [sheetToDelete, setSheetToDelete] = useState<RosterEntry | null>(null);
    const queryClient = useQueryClient();

    // Fetch Roster using task_id and viewMode
    const rosterStatus = viewMode === 'DELETED' ? 'deleted' : 'active';

    const { data: roster, isLoading } = useQuery({
        queryKey: ['roster', taskId, rosterStatus],
        queryFn: () => tasksApi.getRoster(parseInt(taskId), rosterStatus),
        staleTime: 2 * 60 * 1000, // 2 minutes (Cache รายชื่อไว้เท่านี้ จะได้ไม่ต้อง Query บ่อยๆ)
    });

    // Fetch Stats for Deleted Count
    const { data: stats } = useQuery({
        queryKey: ['task-stats', taskId],
        queryFn: () => tasksApi.getTaskStats({ task_id: taskId }),
        // Refresh every 5s or invalidations
    });

    // Fetch Task Details for Class Info
    const { data: task } = useQuery({
        queryKey: ['task', taskId],
        queryFn: () => tasksApi.getTask(parseInt(taskId)),
        staleTime: Infinity, // Task details unlikely to change often
    });

    const deleteSheetsMutation = useMutation({
        mutationFn: (sheetIds: string[]) => sheetsApi.batchDelete(sheetIds.map(id => parseInt(id))),
        onSuccess: (_data, variables) => {
            toast.success(`ลบใบตอบ ${variables.length} ฉบับ`);
            // Remove deleted IDs from selection
            setSelectedSheetIds(prev => {
                const next = new Set(prev);
                variables.forEach(id => next.delete(id));
                return next;
            });
            // Clear selection if the currently viewed sheet was deleted
            if (selectedSheetId && variables.includes(selectedSheetId)) {
                onSelectSheet(undefined);
            }
            setDeleteConfirmOpen(false);
            setSheetToDelete(null);
            queryClient.invalidateQueries({ queryKey: ['roster'] });
            queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });
        },
        onError: () => toast.error("ลบใบตอบไม่สำเร็จ")
    });

    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewBitmask, setReviewBitmask] = useState(0);

    const updateReviewMutation = useMutation({
        mutationFn: (val: number) => tasksApi.updateReviewResults(parseInt(taskId), val),
        onSuccess: () => {
            toast.success("ส่งผลการตรวจสำเร็จ");
            setReviewDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        },
        onError: () => toast.error("ส่งผลการตรวจไม่สำเร็จ")
    });

    const restoreSheetsMutation = useMutation({
        mutationFn: (sheetIds: string[]) => sheetsApi.batchRestore(sheetIds.map(id => parseInt(id))),
        onSuccess: (_data, variables) => {
            toast.success(`กู้คืนใบตอบ ${variables.length} ฉบับ`);
            setSelectedSheetIds(prev => {
                const next = new Set(prev);
                variables.forEach(id => next.delete(id));
                return next;
            });
            queryClient.invalidateQueries({ queryKey: ['roster'] });
            queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });
        },
        onError: (error: any) => {
            if (error.response?.status === 409) {
                toast.error("ไม่สามารถกู้คืนได้ เนื่องจากมีใบคำตอบที่มีเลขที่เดียวกัน");
            } else {
                toast.error("ไม่สามารถกู้คืนได้");
            }
        }
    });

    const [relocateDialogOpen, setRelocateDialogOpen] = useState(false);
    const [targetRelocateTask, setTargetRelocateTask] = useState<Task | null>(null);

    const relocateSheetsMutation = useMutation({
        mutationFn: (targetTask: Task) => sheetsApi.relocate({
            sheet_ids: Array.from(selectedSheetIds).map(id => parseInt(id)),
            source_task_id: parseInt(taskId),
            target_task_id: targetTask.task_id,
            target_class_level: targetTask.class_level,
            target_class_group: targetTask.class_group
        }),
        onSuccess: () => {
            toast.success(`ย้ายใบตอบ ${selectedSheetIds.size} ฉบับสำเร็จ`);
            setRelocateDialogOpen(false);
            setTargetRelocateTask(null);
            setSelectedSheetIds(new Set());
            queryClient.invalidateQueries({ queryKey: ['roster'] });
            queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });
        },
        onError: () => toast.error("ไม่สามารถย้ายใบตอบได้")
    });

    const [swapDialogOpen, setSwapDialogOpen] = useState(false);
    const [targetSwapTask, setTargetSwapTask] = useState<Task | null>(null);

    const swapTaskMutation = useMutation({
        mutationFn: (targetTaskId: number) => sheetsApi.swap({
            task_id_a: parseInt(taskId),
            task_id_b: targetTaskId
        }),
        onSuccess: () => {
            toast.success("สลับใบตอบสำเร็จ");
            setSwapDialogOpen(false);
            setTargetSwapTask(null);
            queryClient.invalidateQueries({ queryKey: ['task-stats'] });
            queryClient.invalidateQueries({ queryKey: ['roster'] });
            queryClient.invalidateQueries({ queryKey: ['task'] });
        },
        onError: () => {
            toast.error("สลับใบตอบไม่สำเร็จ");
        }
    });

    // Reprocess Logic
    const [reprocessDialogOpen, setReprocessDialogOpen] = useState(false);
    const [reprocessTaskId, setReprocessTaskId] = useState<string | null>(null);
    const [selectedProfileId, setSelectedProfileId] = useState<string>("");
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

    const handleUploadSuccess = () => {
        setUploadDialogOpen(false);
        toast.success("อัปโหลดสำเร็จ");
        // Invalidate queries to refresh the list if needed, or wait for server processing
        // Since processing is async, we might not see changes immediately, but good to refresh stats
        queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });
        queryClient.invalidateQueries({ queryKey: ['roster'] });
    };

    const { data: profiles } = useQuery({
        queryKey: ['profiles'],
        queryFn: getProfiles,
        enabled: reprocessDialogOpen,
    });

    const reprocessMutation = useMutation({
        mutationFn: () => sheetsApi.reprocessSheet({
            sheet_ids: Array.from(selectedSheetIds).map(id => parseInt(id)),
            profile_id: parseInt(selectedProfileId)
        }),
        onSuccess: (data) => {
            setReprocessTaskId(data.task_id);
        },
        onError: () => {
            toast.error("ไม่สามารถเริ่มการประมวลผลใหม่ได้");
        }
    });

    const handleReprocessComplete = () => {
        // Refresh everything
        queryClient.invalidateQueries({ queryKey: ['roster'] });
        queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });

        // Invalidate overlays for reprocessed sheets so they reload
        selectedSheetIds.forEach(id => {
            queryClient.invalidateQueries({ queryKey: ['sheet-overlay', id] });
        });

        // Wait a bit before closing or letting user close
        // Actually, let user close it to see the "Completed" state
    };

    // Reset selection when view mode changes
    useEffect(() => {
        setSelectedSheetIds(new Set());
        setLastClickedId(null);
    }, [viewMode]);

    // Shortcut for Deletion Mode
    useEffect(() => {
        const handleShortcut = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Delete') {
                e.preventDefault();
                // Previously toggled Selection Mode, now cleared because select mode is implicit.
                // Or maybe we don't need this shortcut at all? 
                // "Any navigation or click on other row will deactivate select mode."
                // But this shortcut was specifically 'Ctrl+Delete' to toggle checks.
                // Let's remove it or repurpose it? The prompt says "remove select mode checkbox". 
                // Implicitly this specialized toggle is gone.
                // However, maybe user still wants to quickly CLEAR selection?
                setSelectedSheetIds(new Set());
            }
        };
        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, []);

    const displayRoster = useMemo(() => {
        if (!roster) return [];

        if (viewMode === 'DELETED') {
            // Deleted View (Flat list usually, but sort by original filename helps)
            return roster.sort((a, b) => {
                const nameA = a.original_filename || '';
                const nameB = b.original_filename || '';
                return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
            });
        } else if (viewMode === 'MISSING') {
            // Missing View: Filter row_status === 'MISSING', sort by master_roll
            return roster
                .filter(r => r.row_status === 'MISSING')
                .sort((a, b) => {
                    const rollA = parseInt(a.master_roll || '0', 10);
                    const rollB = parseInt(b.master_roll || '0', 10);
                    return rollA - rollB;
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
        setDeleteConfirmOpen(true);
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
                toast.error("ไม่สามารถกู้คืนได้ เนื่องจากมีใบตอบที่มีเลขที่เดียวกัน");
            } else {
                toast.error("ไม่สามารถกู้คืนได้");
            }
        }
    };

    const handleRowClick = (entry: RosterEntry, e?: React.MouseEvent) => {
        if (!entry.sheet_id) return;
        const id = entry.sheet_id;

        // Focus Update (Always do this)
        onSelectSheet(id);

        if (!e) return;

        const newSelection = new Set(selectedSheetIds);

        if (e.shiftKey && lastClickedId) {
            // Range Selection
            const lastIndex = displayRoster.findIndex(r => r.sheet_id === lastClickedId);
            const currIndex = displayRoster.findIndex(r => r.sheet_id === id);

            if (lastIndex !== -1 && currIndex !== -1) {
                const start = Math.min(lastIndex, currIndex);
                const end = Math.max(lastIndex, currIndex);

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
            // Single Select (Always available now) - Clear others
            newSelection.clear();
            newSelection.add(id);
            setLastClickedId(id);
        }

        setSelectedSheetIds(newSelection);
    };

    // Keyboard Navigation
    useEffect(() => {
        if (displayRoster.length === 0) return;

        const handleKeyDown = async (e: KeyboardEvent) => {
            const tempTarget = e.target as HTMLElement;
            const tagName = tempTarget.tagName;

            // Prevent handling if a dialog or popover is open
            if (tempTarget.closest('[role="dialog"]') || tempTarget.closest('[role="combobox"]') || tempTarget.closest('[data-radix-popper-content-wrapper]')) {
                return;
            }

            if (['INPUT', 'TEXTAREA'].includes(tagName) || editingSheetId || deleteConfirmOpen) return;


            const currentIndex = displayRoster.findIndex(r => r.sheet_id === selectedSheetId);
            let nextIndex = currentIndex;

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
                                    let msg = "";
                                    if (actionType === 'present') msg = "ยืนยันว่ามาสอบสำเร็จ";
                                    else if (actionType === 'too_few') msg = "ยืนยันว่าตอบไม่ครบสำเร็จ";
                                    toast.success(msg);
                                    queryClient.invalidateQueries({ queryKey: ['roster'] });
                                    queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });
                                    handleCorrect();
                                } catch (err) { toast.error("อัปเดตสถานะใบตอบไม่สำเร็จ"); }
                            } else { toast.info("ไม่มีการแก้ไข"); }
                        }
                    } else {
                        e.preventDefault();
                        if (currentIndex !== -1) {
                            const entry = displayRoster[currentIndex];
                            if (entry.sheet_id) setEditingSheetId(entry.sheet_id);
                        }
                    }
                    break;
                case 'ArrowLeft':
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
                    // Update selection to just this item (Single Select on Nav) - mimicking Excel
                    // Unless Shift held? (Standard excel does shift+arrow to extend).
                    // User requirements didn't explicitly ask for Shift+Arrow, but said "Any navigation ... will deactivate select mode"
                    // Wait, "Any navigation or click on other row will deactivate select mode."
                    // This creates a misunderstanding. "Deactivate select mode" in previous context meant "Turn off the checkbox mode". 
                    // In new context (Excel like), clicking another row (without modifiers) just selects THAT row (clearing previous multi-selection).
                    // So we should just set selection to this single item.

                    setSelectedSheetIds(new Set([nextItem.sheet_id]));
                    setLastClickedId(nextItem.sheet_id);

                    // Adjusted scroll to keep visual context (2 rows above)
                    rowVirtualizer.scrollToIndex(Math.max(0, nextIndex - 2), { align: 'start' });
                }
            }
        };

        const handleQuickActions = (e: KeyboardEvent) => {
            // Quick Delete: Shift + Delete (Works on single focused item if no multi-selection, or multi-selection if exists)
            // Actually existing logic was: (!isSelectionMode && shift+delete && slectedSheetId) -> delete single.
            // Now logic should be: if selection exists, delete them.
            // But wait, user might just have one item selected (focused).
            // Let's keep Shift+Delete as "Delete Selected" (including current focused if it's in selection).
            // Quick Delete: Shift + Delete
            if (e.shiftKey && e.key === 'Delete') {
                e.preventDefault();

                // If we have a batch selection, we delete those.
                if (selectedSheetIds.size > 0) {
                    setDeleteConfirmOpen(true);
                }
                // If no selection but we have a focused item (selectedSheetId), we treat that as the target.
                else if (selectedSheetId) {
                    // To handle this cleanly with the unified dialog (which looks at selectedSheetIds usually, or sheetToDelete fallback?)
                    // Let's set the selection to this item so the dialog logic is uniform.
                    setSelectedSheetIds(new Set([selectedSheetId]));
                    setDeleteConfirmOpen(true);
                }
            }
            // Quick Restore: Shift + Insert
            if (e.shiftKey && (e.key === 'Insert' || e.code === 'Insert') && selectedSheetId && viewMode === 'DELETED') {
                e.preventDefault();
                // Immediate restore without confirmation
                restoreSheetsMutation.mutate([selectedSheetId]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keydown', handleQuickActions);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keydown', handleQuickActions);
        };
    }, [displayRoster, selectedSheetId, onSelectSheet, rowVirtualizer, viewMode, queryClient, editingSheetId, deleteSheetsMutation, restoreSheetsMutation]);

    // ... (Focus Retention and Auto-Scroll effects) ...
    const lastSelectedIdRef = useRef<string | undefined>();
    useEffect(() => {
        const hasSelectionChanged = selectedSheetId !== lastSelectedIdRef.current;
        const isFirstLoad = !lastSelectedIdRef.current && selectedSheetId;
        if ((hasSelectionChanged || isFirstLoad) && selectedSheetId && displayRoster.length > 0) {
            const index = displayRoster.findIndex(r => r.sheet_id === selectedSheetId);
            if (index !== -1) {
                // Adjusted scroll to keep visual context (2 rows above)
                rowVirtualizer.scrollToIndex(Math.max(0, index - 2), { align: 'start' });
            }
        }
        lastSelectedIdRef.current = selectedSheetId;
    }, [selectedSheetId, displayRoster, rowVirtualizer]);

    // Cleanup / Auto-Advance Logic
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


    const handleErrorNavigation = (direction: 'up' | 'down') => {
        const currentIndex = displayRoster.findIndex(r => r.sheet_id === selectedSheetId);
        let nextIndex = currentIndex;

        if (direction === 'down') {
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
        } else {
            const errorIndices = displayRoster
                .map((r, idx) => ({ ...r, originalIndex: idx }))
                .filter(r => ['ERROR', 'GHOST', 'UNEXPECTED', 'ABSENT', 'DUPLICATE', 'ABSENT_MISMATCH'].includes(r.row_status))
                .map(r => r.originalIndex);
            if (errorIndices.length > 0) {
                const prevErrors = errorIndices.filter(idx => idx < currentIndex);
                if (prevErrors.length > 0) nextIndex = prevErrors[prevErrors.length - 1];
                else nextIndex = errorIndices[errorIndices.length - 1]; // Unwrap to last
            }
        }

        if (nextIndex !== currentIndex && nextIndex !== -1) {
            const nextItem = displayRoster[nextIndex];
            if (nextItem.sheet_id) {
                onSelectSheet(nextItem.sheet_id);
                setSelectedSheetIds(new Set([nextItem.sheet_id]));
                setLastClickedId(nextItem.sheet_id);
                rowVirtualizer.scrollToIndex(Math.max(0, nextIndex - 2), { align: 'start' });
            }
        }
    };

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
                        ตรวจใบตอบ
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`text-xs px-3 ${viewMode === 'DELETED' ? 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800' : 'text-slate-600'}`}
                        onClick={() => setViewMode('DELETED')}
                    >
                        <span className="mr-1">🗑️</span>
                        ถูกลบ ({deletedCount})
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`text-xs px-3 ${viewMode === 'MISSING' ? ((task?.review_results || 0) > 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200') : (roster?.filter(r => r.row_status === 'MISSING').length || 0) > 0 ? 'text-red-600 font-medium' : 'text-slate-600'}`}
                        onClick={() => setViewMode('MISSING')}
                    >
                        <UserX className="w-3 h-3 mr-1" />
                        ไม่มีใบตอบ {(roster?.filter(r => r.row_status === 'MISSING').length || 0) > 0 && `( ${roster?.filter(r => r.row_status === 'MISSING').length || 0} )`}
                    </Button>
                    {/* Relocate Button (Only visible if selection > 0) */}
                    {selectedSheetIds.size > 0 && viewMode === 'SEQUENTIAL' && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 ml-2"
                            onClick={() => setRelocateDialogOpen(true)}
                        >
                            <ArrowRightToLine className="w-4 h-4 mr-1" />
                            ย้ายใบตอบ
                        </Button>
                    )}
                </div>

                {viewMode === 'MISSING' && (
                    <div className="flex items-center gap-2 px-2 border-l border-slate-200">
                        <Button
                            size="sm"
                            variant={((task?.review_results || 0) > 0) ? "outline" : "default"}
                            className="h-7 text-xs"
                            onClick={() => {
                                setReviewBitmask(task?.review_results || 0);
                                setReviewDialogOpen(true);
                            }}
                        >
                            {((task?.review_results || 0) > 0) ? "เปลี่ยนการยืนยัน" : "ยืนยันไม่มีใบตอบ"}
                        </Button>
                    </div>
                )}

                {/* Batch Actions Toolbar */}
                {selectedSheetIds.size > 0 && (
                    <div className="flex items-center gap-2 px-2 border-l border-slate-200">
                        <span className="text-xs text-slate-500">{selectedSheetIds.size} selected</span>
                        {viewMode === 'SEQUENTIAL' && (
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleBatchDelete}>
                                ลบ
                            </Button>
                        )}
                        {viewMode === 'DELETED' && (
                            <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={handleBatchRestore}>
                                กู้คืน
                            </Button>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2 ml-auto">
                    <div className="flex items-center gap-1 border-r pr-2 mr-2 border-slate-200">

                        {/* Error Navigation Group */}
                        {viewMode === 'SEQUENTIAL' && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                    onClick={() => handleErrorNavigation('up')}
                                    title="ข้อผิดพลาดย้อนหลัง (Ctrl+Up)"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50 mr-2"
                                    onClick={() => handleErrorNavigation('down')}
                                    title="ข้อผิดพลาดถัดไป (Ctrl+Down)"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </>
                        )}

                        {/* Reprocess Button */}
                        {selectedSheetIds.size > 0 && viewMode === 'SEQUENTIAL' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                    setReprocessDialogOpen(true);
                                    setReprocessTaskId(null);
                                    setSelectedProfileId("");
                                }}
                                title="ประมวลผลใหม่ (Reprocess)"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        )}

                        {/* Upload Images Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => setUploadDialogOpen(true)}
                            title="อัปโหลดรูปภาพ"
                        >
                            <CloudUpload className="w-4 h-4" />
                        </Button>

                        {/* Swap Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                            onClick={() => setSwapDialogOpen(true)}
                            title="สลับใบตอบทั้งหมดกับสนาม..."
                        >
                            <ArrowLeftRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div
                ref={parentRef}
                className="flex-1 overflow-auto p-2 outline-none select-none"
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
                            const isBatchSelected = entry.sheet_id ? selectedSheetIds.has(entry.sheet_id) : false;
                            const isFocused = entry.sheet_id === selectedSheetId;
                            const isClickable = !!entry.sheet_id;

                            // Editing Logic
                            const isOpen = editingSheetId === entry.sheet_id;
                            const onOpenChange = (open: boolean) => {
                                if (open) setEditingSheetId(entry.sheet_id as string);
                                else setEditingSheetId(null);
                            };

                            // Logic for neighbor context (for smart suggestions)
                            // Hooks cannot be used in loops. Calculation is cheap enough to be direct.
                            const prevEntry = displayRoster[virtualRow.index - 1];
                            const nextEntry = displayRoster[virtualRow.index + 1];

                            const getRoll = (e: RosterEntry | undefined) => {
                                if (!e) return undefined;
                                return parseInt(e.master_roll || e.sheet_roll || '0', 10);
                            };

                            const prevMasterRoll = getRoll(prevEntry);
                            const nextMasterRoll = getRoll(nextEntry);

                            // Valid Class/Group extraction from Task
                            const classLevel = task?.class_level || 0;
                            const group = task?.class_group || 0;

                            return (
                                <StudentRow
                                    key={entry.sheet_id || `missing-${entry.master_roll}-${virtualRow.index}`}
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
                                    isBatchSelected={isBatchSelected}
                                    onSelect={(e) => handleRowClick(entry, e)}
                                    viewMode={viewMode}
                                    fullRoster={roster || []}
                                    classLevel={classLevel}
                                    group={group}
                                    isOpen={isOpen}
                                    onOpenChange={onOpenChange}
                                    taskId={taskId}
                                    onCorrect={() => {
                                        queryClient.invalidateQueries({ queryKey: ['roster'] });
                                        queryClient.invalidateQueries({ queryKey: ['task-stats', taskId] });
                                    }}
                                    prevMasterRoll={prevMasterRoll}
                                    nextMasterRoll={nextMasterRoll}
                                />
                            );
                        })}
                    </TooltipProvider>
                </div>
            </div>

            {(!roster || roster.length === 0) && (
                <div className="text-center text-slate-400 mt-10">No sheets found in this view</div>
            )}

            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-[425px] p-8"> {/* Increased padding */}
                    <div className="flex flex-col items-center gap-4 text-center">

                        {/* 1. The SweetAlert Style Icon */}
                        <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-red-100">
                            <AlertCircle className="size-10 text-red-600" />
                        </div>

                        <DialogHeader className="w-full">
                            {/* 2. Larger, centered Title */}
                            <DialogTitle className="text-center text-2xl font-bold text-slate-900">
                                ยืนยันการลบ?
                            </DialogTitle>

                            {/* 3. Readable Description */}
                            <DialogDescription className="text-center text-base pt-2">
                                {selectedSheetIds.size > 1 ? (
                                    <>
                                        ท่านต้องการลบใบคำตอบ <br />
                                        <span className="font-bold text-slate-900 text-lg">
                                            จำนวน {selectedSheetIds.size} ฉบับ
                                        </span>
                                        <span className="ml-1 text-slate-500">
                                            ที่เลือกไว้
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        ท่านต้องการลบใบคำตอบของ <br />
                                        <span className="font-bold text-slate-900 text-lg">
                                            {(() => {
                                                const id = Array.from(selectedSheetIds)[0];
                                                const entry = displayRoster.find(r => r.sheet_id === id);
                                                return entry?.student_name || 'Unknown';
                                            })()}
                                        </span>
                                        <span className="ml-1 text-slate-500">
                                            ({(() => {
                                                const id = Array.from(selectedSheetIds)[0];
                                                const entry = displayRoster.find(r => r.sheet_id === id);
                                                return entry?.sheet_roll || '-';
                                            })()})
                                        </span>
                                    </>
                                )}
                                <span className="mt-2 text-sm text-slate-500 block">
                                    ข้อมูลนี้จะย้ายไปอยู่ในถังขยะและสามารถกู้คืนได้
                                </span>
                            </DialogDescription>
                        </DialogHeader>

                        {/* 4. Modern Button Layout */}
                        <DialogFooter className="w-full sm:justify-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteConfirmOpen(false)}
                                className="w-full sm:w-auto min-w-[100px] border-slate-300 hover:bg-slate-100"
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                variant="destructive"
                                className="w-full sm:w-auto min-w-[100px] bg-red-600 hover:bg-red-700 font-semibold shadow-md"
                                onClick={() => {
                                    if (selectedSheetIds.size > 0) {
                                        deleteSheetsMutation.mutate(Array.from(selectedSheetIds));
                                    }
                                }}
                            >
                                ใช่, ลบเลย
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>แจ้งผลการตรวจ</DialogTitle>
                        <DialogDescription>
                            <span className="font-bold text-slate-900">ได้ทำการตรวจแล้ว</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-4">
                        <div className="flex items-center space-x-2">
                            <CheckSquare
                                className={`w-5 h-5 cursor-pointer ${(reviewBitmask & 1) ? "text-blue-600" : "text-slate-300"}`}
                                onClick={() => setReviewBitmask(prev => prev ^ 1)}
                            />
                            <label className="text-sm cursor-pointer select-none" onClick={() => setReviewBitmask(prev => prev ^ 1)}>
                                นักเรียนที่มีสถานะมาสอบแต่ไม่มีใบตอบจริง
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckSquare
                                className={`w-5 h-5 cursor-pointer ${(reviewBitmask & 2) ? "text-blue-600" : "text-slate-300"}`}
                                onClick={() => setReviewBitmask(prev => prev ^ 2)}
                            />
                            <label className="text-sm cursor-pointer select-none" onClick={() => setReviewBitmask(prev => prev ^ 2)}>
                                ใบตอบน้อยกว่าจำนวนเข้าสอบจริง
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckSquare
                                className={`w-5 h-5 cursor-pointer ${(reviewBitmask & 4) ? "text-blue-600" : "text-slate-300"}`}
                                onClick={() => setReviewBitmask(prev => prev ^ 4)}
                            />
                            <label className="text-sm cursor-pointer select-none" onClick={() => setReviewBitmask(prev => prev ^ 4)}>
                                ใบตอบมากกว่าจำนวนเข้าสอบจริง
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={() => updateReviewMutation.mutate(reviewBitmask)}>บันทึก</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={reprocessDialogOpen} onOpenChange={(open) => {
                if (!open && reprocessTaskId) {
                    // specific cleanup if needed when closing mid-process?
                    // usually okay to just close
                }
                setReprocessDialogOpen(open);
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>ประมวลผลใหม่ (Reprocess)</DialogTitle>
                        <DialogDescription>
                            เลือกโปรไฟล์ที่ต้องการใช้ในการตรวจใบตอบที่เลือก ({selectedSheetIds.size} ฉบับ) ใหม่
                        </DialogDescription>
                    </DialogHeader>

                    {!reprocessTaskId ? (
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">เลือกโปรไฟล์ (Scan Profile)</label>
                                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกโปรไฟล์..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {profiles?.map(p => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4">
                            <ReprocessTaskStream
                                taskId={reprocessTaskId}
                                onComplete={handleReprocessComplete}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        {!reprocessTaskId ? (
                            <>
                                <Button variant="outline" onClick={() => setReprocessDialogOpen(false)}>ยกเลิก</Button>
                                <Button
                                    onClick={() => reprocessMutation.mutate()}
                                    disabled={!selectedProfileId || reprocessMutation.isPending}
                                >
                                    {reprocessMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                    เริ่มประมวลผล
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setReprocessDialogOpen(false)}>ปิด</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* Relocate Dialog */}
            <Dialog open={relocateDialogOpen} onOpenChange={setRelocateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ย้ายใบตอบ</DialogTitle>
                        <DialogDescription>
                            ต้องการย้ายใบตอบจำนวน <strong>{selectedSheetIds.size}</strong> ฉบับไปที่
                            <br />
                            กรุณาเลือกสนามสอบปลายทาง
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <label className="text-sm font-medium">สนามสอบ-ชั้น-ช่วงชั้น</label>
                        <TaskSearchPopover
                            onSelect={setTargetRelocateTask}
                            selectedTask={targetRelocateTask}
                            buttonLabel="เลือกสนามสอบปลายทาง..."
                            excludedTaskId={parseInt(taskId)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRelocateDialogOpen(false)}>ยกเลิก</Button>
                        <Button
                            onClick={() => {
                                if (targetRelocateTask) relocateSheetsMutation.mutate(targetRelocateTask);
                            }}
                            disabled={!targetRelocateTask || relocateSheetsMutation.isPending}
                        >
                            {relocateSheetsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Ok
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Swap All Sheets Dialog */}
            <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>สลับใบตอบทั้งหมด</DialogTitle>
                        <DialogDescription asChild>
                            <div className="text-sm text-muted-foreground">
                                <div className="p-3 bg-red-50 border border-red-100 rounded-md flex gap-1">
                                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                                    <div className="text-sm text-red-700">
                                        <strong>คำเตือน:</strong> สลับใบตอบทั้งหมด กับสนามที่เลือก
                                        <br />
                                        (ใช้เมื่อใบนำสแกนสลับกันเท่านั้น)
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">เลือกสนามที่ต้องการสลับ:</label>
                                    <TaskSearchPopover
                                        onSelect={setTargetSwapTask}
                                        selectedTask={targetSwapTask}
                                        buttonLabel="เลือกสนามที่ต้องการสลับ..."
                                        excludedTaskId={parseInt(taskId)}
                                    />
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSwapDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            disabled={!targetSwapTask || swapTaskMutation.isPending}
                            onClick={() => {
                                if (targetSwapTask) swapTaskMutation.mutate(targetSwapTask.task_id);
                            }}
                        >
                            {swapTaskMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm Swap
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>อัปโหลดรูปภาพเพิ่มเติม</DialogTitle>
                        <DialogDescription>
                            อัปโหลดไฟล์รูปภาพ (.jpg) สำหรับ Task นี้
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <ImageUploadForm
                            taskId={taskId}
                            onSuccess={handleUploadSuccess}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
