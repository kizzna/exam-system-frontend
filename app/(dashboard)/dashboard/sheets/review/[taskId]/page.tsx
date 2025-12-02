'use client';

import React, { useState, use, useEffect } from 'react';
import { HeaderImageViewer } from '@/components/sheets/header-image-viewer';
import { StatsPanel } from '@/components/sheets/stats-panel';
import { StudentTable } from '@/components/sheets/student-table';
import { AnswerImageViewer } from '@/components/sheets/answer-image-viewer';
import { tasksApi } from '@/lib/api/tasks';

export default function OMRReviewPage({ params }: { params: Promise<{ taskId: string }> }) {
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

    return (
        <>
            <div className="block lg:hidden h-screen w-screen flex items-center justify-center bg-slate-50 p-8 text-center">
                <div className="max-w-md">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Desktop Required</h2>
                    <p className="text-slate-600">The OMR Correction Editor requires a large screen to display documents and data side-by-side. Please open this task on a computer.</p>
                </div>
            </div>
            <main className="hidden lg:flex h-screen w-screen bg-slate-50 p-2 overflow-hidden flex-col">

                {/* Optional: Minimal Global Header (Breadcrumbs/Back Button) */}
                <header className="h-10 shrink-0 flex items-center justify-center px-2 mb-2 gap-4">
                    <h1 className="font-bold text-sm text-slate-700">
                        สนามสอบ: {taskId} {examCenterInfo ? `(${examCenterInfo})` : ''}
                    </h1>
                    {/* Add Back Button Here */}
                </header>

                {/* CORE GRID LAYOUT */}
                <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-3 min-h-0">

                    {/* --- PANEL A: Top Left (Header Image) --- */}
                    {/* Proportions: ~58% width, ~42% height */}
                    <section className="col-span-7 row-span-5 bg-white rounded-lg border shadow-sm relative overflow-hidden flex flex-col">
                        <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            Panel A: Header Image Crop
                        </div>
                        <HeaderImageViewer sheetId={selectedSheetId} />
                    </section>

                    {/* --- PANEL B: Top Right (Stats & Tools) --- */}
                    {/* Proportions: ~42% width, ~42% height */}
                    <section className="col-span-5 row-span-5 bg-white rounded-lg border shadow-sm p-4 overflow-y-auto">
                        <div className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Panel B: Stats & Actions
                        </div>
                        <StatsPanel taskId={taskId} />
                    </section>

                    {/* --- PANEL C: Bottom Left (Data Table) --- */}
                    {/* Proportions: ~58% width, ~58% height */}
                    <section className="col-span-7 row-span-7 bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden">
                        <div className="p-2 border-b bg-slate-50 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">Panel C: Student Roster</span>
                            <input type="text" placeholder="Search..." className="text-xs border rounded px-2 py-1" />
                        </div>

                        {/* Table Container - Must allow internal scrolling */}
                        <div className="flex-1 overflow-auto bg-white p-4">
                            <StudentTable
                                taskId={taskId}
                                selectedSheetId={selectedSheetId}
                                onSelectSheet={setSelectedSheetId}
                            />
                        </div>
                    </section>

                    {/* --- PANEL D: Bottom Right (Answer Image) --- */}
                    {/* Proportions: ~42% width, ~58% height */}
                    <section className="col-span-5 row-span-7 bg-white rounded-lg border shadow-sm relative overflow-hidden flex flex-col">
                        <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            Panel D: Answer Sheet Overlay
                        </div>
                        <AnswerImageViewer sheetId={selectedSheetId} />
                    </section>

                </div>
            </main>
        </>
    );
}
