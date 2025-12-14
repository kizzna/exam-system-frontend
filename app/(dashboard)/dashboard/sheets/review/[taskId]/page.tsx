'use client';

import React, { useState, use, useEffect } from 'react';
import { HeaderImageViewer } from '@/components/sheets/header-image-viewer';
import { StatsPanel } from '@/components/sheets/stats-panel';
import { StudentTable } from '@/components/sheets/student-table';
import { AnswerImageViewer } from '@/components/sheets/answer-image-viewer';
import { TaskReviewNavigator } from '@/components/sheets/task-navigator';
import { tasksApi } from '@/lib/api/tasks';
import { sheetsApi } from '@/lib/api/sheets';
import { useQueryClient, useQuery } from '@tanstack/react-query';

export default function OMRReviewPage({ params }: { params: Promise<{ taskId: string }> }) {
    const queryClient = useQueryClient();
    const { taskId } = use(params);
    const [selectedSheetId, setSelectedSheetId] = useState<string>();
    const [examCenterInfo, setExamCenterInfo] = useState<string | null>(null);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const info = await tasksApi.getExamCenterInfo(taskId);
                setExamCenterInfo(info.center_name);
            } catch (error) {
                console.error('Failed to fetch exam center info:', error);
            }
        };
        fetchInfo();
    }, [taskId]);

    // 1. OPTIMIZE: Add staleTime to match your prefetching strategy (5 mins)
    // This prevents the parent from trying to refetch in background immediately
    const { data: overlay, isLoading } = useQuery({
        queryKey: ['sheet-overlay', selectedSheetId],
        queryFn: () => sheetsApi.getOverlay(selectedSheetId!),
        enabled: !!selectedSheetId,
        staleTime: 1000 * 60 * 2, // (Cache for 2 minutes)
    });

    // Prefetching Logic
    useEffect(() => {
        if (!selectedSheetId) return;

        // Get roster data from cache
        const roster = queryClient.getQueryData<any[]>(['roster', taskId]);
        if (!roster) return;

        const currentIndex = roster.findIndex(r => r.sheet_id === selectedSheetId);
        if (currentIndex === -1) return;

        // Prefetch next 5 items
        const nextIndices = [1, 2, 3, 4, 5]
            .map(offset => currentIndex + offset)
            .filter(idx => idx < roster.length);

        nextIndices.forEach(idx => {
            const sheet = roster[idx];
            if (!sheet.sheet_id) return;

            // 1. Prefetch Overlay Data
            queryClient.prefetchQuery({
                queryKey: ['sheet-overlay', sheet.sheet_id],
                queryFn: () => sheetsApi.getOverlay(sheet.sheet_id!),
                staleTime: 1000 * 60 * 2, // 2 minutes
            });

            // 2. Prefetch Images (Browser Cache)
            const imgTop = new Image();
            imgTop.src = sheetsApi.getSheetImageUrl(sheet.sheet_id, 'top', 920);

            const imgBottom = new Image();
            imgBottom.src = sheetsApi.getSheetImageUrl(sheet.sheet_id, 'bottom', 350);
        });
    }, [selectedSheetId, taskId, queryClient]);

    return (
        <>
            <div className="block lg:hidden h-screen w-screen flex items-center justify-center bg-slate-50 p-8 text-center">
                <div className="max-w-md">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Desktop Required</h2>
                    <p className="text-slate-600">The OMR Correction Editor requires a large screen to display documents and data side-by-side. Please open this task on a computer.</p>
                </div>
            </div>
            <div className="hidden lg:flex w-full h-[calc(100vh-3rem)] bg-slate-50 p-2 overflow-hidden flex-col">

                {/* Optional: Minimal Global Header (Breadcrumbs/Back Button) */}
                <header className="h-10 shrink-0 flex items-center justify-center px-2 mb-2 gap-4">
                    {/* Exam Center Details */}
                    <h1 className="font-bold text-sm text-slate-700">
                        สนามสอบ: {taskId} {examCenterInfo ? `(${examCenterInfo})` : ''}
                    </h1>
                    {/* Task Navigator */}
                    <div className="flex justify-center items-center">
                        <TaskReviewNavigator currentTaskId={Number(taskId)} />
                    </div>
                </header>

                {/* CORE GRID LAYOUT */}
                <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-3 min-h-0">

                    {/* --- PANEL A: Top Left (Header Image) --- */}
                    {/* Proportions: ~58% width, ~42% height */}
                    <section className="col-span-7 row-span-5 bg-white rounded-lg border shadow-sm relative overflow-hidden flex flex-col">
                        {/* <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            แผง A: ภาพส่วนบน (ข้อมูลผู้ขอเข้าสอบ)
                        </div> */}
                        <HeaderImageViewer sheetId={selectedSheetId} />
                    </section>

                    {/* --- RIGHT COLUMN WRAPPER (Panel B + Panel D) --- */}
                    {/* Occupies full right height (12 rows), Internal Flex 3:9 */}
                    <div className="col-span-5 row-span-12 flex flex-col gap-3 min-h-0">
                        {/* --- PANEL B: Top Right (Stats & Tools) --- */}
                        <section className="flex-[3] bg-white rounded-lg border shadow-sm p-4 overflow-y-auto min-h-0">
                            <StatsPanel taskId={taskId} />
                        </section>

                        {/* --- PANEL D: Bottom Right (Answer Image) --- */}
                        <section className="col-span-5 row-span-7 bg-white rounded-lg border shadow-sm relative overflow-hidden flex flex-col">
                            <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                แผง D: คำตอบ 150 ข้อ
                            </div>
                            <AnswerImageViewer
                                sheetId={selectedSheetId}
                                taskId={taskId}
                                // 2. PASS THE DATA DOWN
                                overlayData={overlay}
                            />
                        </section>
                    </div>

                    {/* --- PANEL C: Bottom Left (Data Table) --- */}
                    {/* Proportions: ~58% width, ~58% height */}
                    <section className="col-span-7 row-span-7 bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden">
                        {/* <div className="p-2 border-b bg-slate-50 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">แผง C: รายชื่อผู้สมัครสอบ</span>
                            <input type="text" placeholder="Search..." className="text-xs border rounded px-2 py-1" />
                        </div> */}

                        {/* Table Container - Must allow internal scrolling */}
                        <div className="flex-1 overflow-auto bg-white p-4">
                            <StudentTable
                                taskId={taskId}
                                selectedSheetId={selectedSheetId}
                                onSelectSheet={setSelectedSheetId}
                            />
                        </div>
                    </section>

                </div>
            </div>
        </>
    );
}
