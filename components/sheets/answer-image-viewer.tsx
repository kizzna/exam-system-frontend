'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sheetsApi } from '@/lib/api/sheets';
import { SmartImage, SmartImageItem } from './smart-image';
import { Loader2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnswerEditor } from './answer-editor';
import { useQueryClient } from '@tanstack/react-query';

interface AnswerItem {
    q: number;
    val: number | null;
}

interface SheetOverlayData {
    bottom?: {
        dimensions: { w: number; h: number };
        answers: AnswerItem[];
    };
    top?: {
        scores?: Record<string, number>;
    };
}

interface AnswerImageViewerProps {
    sheetId?: string;
    overlayData?: SheetOverlayData;
}

// Subject configuration: question ranges and colors
const SUBJECTS = [
    { name: 'subject1', label: 'ธรรม', range: [1, 50], color: 'bg-blue-500', borderColor: 'border-blue-600' },
    { name: 'subject2', label: 'พุทธ', range: [51, 100], color: 'bg-green-500', borderColor: 'border-green-600' },
    { name: 'subject3', label: 'วินัย', range: [101, 150], color: 'bg-orange-500', borderColor: 'border-orange-600' },
];

export function AnswerImageViewer({ sheetId, taskId, overlayData }: AnswerImageViewerProps & { taskId: string }) {
    const [showCorrectAnswers, setShowCorrectAnswers] = React.useState(true);
    const [showStudentMarks, setShowStudentMarks] = React.useState(true);
    const [showAllOverlays, setShowAllOverlays] = React.useState(true);
    const [isEditorOpen, setIsEditorOpen] = React.useState(false);
    const queryClient = useQueryClient();

    /* const { data: overlay, isLoading: isLoadingOverlay } = useQuery({
        queryKey: ['sheet-overlay', sheetId],
        queryFn: () => sheetsApi.getOverlay(sheetId!),
        enabled: !!sheetId,
    }); */

    // 4. Use the prop instead (rename it to match existing code usage)
    const overlay = overlayData;

    const { data: layout, isLoading: isLoadingLayout } = useQuery({
        queryKey: ['omr-layout'],
        queryFn: () => sheetsApi.getLayout(),
        staleTime: Infinity,
    });

    const { data: answerKey, isLoading: isLoadingAnswerKey } = useQuery({
        queryKey: ['answer-key', taskId],
        queryFn: () => sheetsApi.getAnswerKey(taskId),
        enabled: !!taskId,
        staleTime: Infinity,
    });

    // Calculate statistics per subject (must be before conditional returns)
    const subjectStats = useMemo(() => {
        // 1. Guard clause checks existence
        if (!overlay?.bottom?.answers || !answerKey) return [];

        // 2. Extract answers to a const variable here (TypeScript sees this is safe now)
        const allAnswers = overlay.bottom.answers;

        return SUBJECTS.map((subject) => {
            const [start, end] = subject.range;

            // 3. Use 'allAnswers' instead of 'overlay.bottom.answers'
            const subjectAnswers = allAnswers.filter(
                (ans) => ans.q >= start && ans.q <= end
            );

            const answered = subjectAnswers.filter(
                (ans) => ans.val !== null && ans.val !== undefined && ans.val !== 0
            ).length;

            const correct = subjectAnswers.filter((ans) => {
                const correctVal = answerKey[ans.q.toString()];
                return ans.val !== null && ans.val === correctVal;
            }).length;

            const incorrect = answered - correct;
            const score = overlay.top?.scores?.[subject.name] || 0;

            return {
                ...subject,
                answered,
                correct,
                incorrect,
                score,
            };
        });
    }, [overlay, answerKey]);

    // Calculate items for overlay (must be before conditional returns)
    const items: SmartImageItem[] = useMemo(() => {
        if (!showAllOverlays) return [];
        if (!overlay?.bottom?.answers || !layout?.questions || !layout?.config?.bottom || !answerKey) return [];

        const studentItems: SmartImageItem[] = [];
        const correctItems: SmartImageItem[] = [];
        const { answers } = overlay.bottom;
        const { questions, config } = layout;

        // Coordinate Transformation Logic
        // 1. Get Crop Config
        const { crop_x, crop_y } = config.bottom;

        // Helper to transform coordinates: (AbsX, AbsY) -> (RelX, RelY)
        const transform = (absX: number, absY: number) => {
            const relX = absX - crop_x;
            const relY = absY - crop_y;
            return {
                x: relX,
                y: relY
            };
        };

        answers.forEach((ans) => {
            const qNum = ans.q.toString();
            const questionCoords = questions[qNum];
            const correctVal = answerKey[qNum];

            if (!questionCoords) return;

            // 1. Draw Student Answer (if any)
            if (showStudentMarks && ans.val !== null && ans.val !== undefined && ans.val !== 0) {
                // Determine which option was selected (A=1, B=2, C=4, D=8)
                const values = [1, 2, 4, 8];
                const options = ['A', 'B', 'C', 'D'];

                values.forEach((val, idx) => {
                    if ((ans.val! & val) === val) {
                        const option = options[idx];
                        const coord = questionCoords[option];
                        if (coord) {
                            const { x, y } = transform(coord.x, coord.y);
                            const isCorrect = (ans.val === correctVal);
                            studentItems.push({
                                id: `q_${qNum}_student`,
                                x,
                                y,
                                type: isCorrect ? 'circle' : 'cross',
                                color: isCorrect ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)',
                                r: isCorrect ? 14 : 16, // bubble radius : cross size
                                lineWidth: isCorrect ? 2 : 6,
                            });
                        }
                    }
                });
            }

            // 2. Draw Correct Answer (if student was wrong or didn't answer)
            // If student was wrong (ans.val !== correctVal) OR didn't answer (ans.val === 0/null)
            // But only if we know the correct value
            if (showCorrectAnswers && correctVal !== undefined && (ans.val !== correctVal)) {
                const values = [1, 2, 4, 8, 16];
                const options = ['A', 'B', 'C', 'D', 'E'];

                values.forEach((val, idx) => {
                    if ((correctVal & val) === val) {
                        const option = options[idx];
                        const coord = questionCoords[option];
                        if (coord) {
                            const { x, y } = transform(coord.x, coord.y);
                            correctItems.push({
                                id: `q_${qNum}_correct`,
                                x,
                                y,
                                type: 'correct',
                                color: 'rgba(0, 0, 255, 0.8)',
                            });
                        }
                    }
                });
            }
        });

        return [...studentItems, ...correctItems];
    }, [overlay, layout, answerKey, showAllOverlays, showStudentMarks, showCorrectAnswers]);

    if (!sheetId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-100/50 h-full">
                <span className="text-slate-400 text-sm">Select a sheet to view</span>
            </div>
        );
    }

    // 5. Check if overlay is undefined instead of isLoadingOverlay
    if (!overlay || isLoadingLayout || isLoadingAnswerKey) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-100/50 h-full">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!overlay?.bottom) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-100/50 h-full">
                <span className="text-slate-400 text-sm">No overlay data available</span>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-start justify-start bg-slate-100/50 p-2 overflow-hidden">
            {/* Main Flex Container */}
            <div className="flex items-start gap-1 h-full flex-1">

                {/* 1. Image Area */}
                <div className="h-full flex-shrink-0">
                    <SmartImage
                        src={sheetsApi.getSheetImageUrl(sheetId, 'bottom', 350)}
                        width={overlay.bottom.dimensions.w}
                        height={overlay.bottom.dimensions.h}
                        items={items}
                        alignment="left"
                    />
                </div>

                {/* 2. Stats Column */}
                <div className="flex flex-col gap-3 flex-shrink-0 -ml-1">
                    {/* View Controls */}
                    <div className="flex flex-col gap-2 mb-1">
                        {/* ... Existing Toggle Buttons ... */}
                        <Button
                            variant={showCorrectAnswers ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
                            className="w-full text-xs justify-start"
                        >
                            เฉลย
                        </Button>
                        <Button
                            variant={showStudentMarks ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowStudentMarks(!showStudentMarks)}
                            className="w-full text-xs justify-start"
                        >
                            การตรวจ
                        </Button>
                        <Button
                            variant={showAllOverlays ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowAllOverlays(!showAllOverlays)}
                            className="w-full text-xs justify-start"
                        >
                            ทั้งหมด
                        </Button>

                        {/* Button acts as Trigger only now */}
                        <Button
                            variant={isEditorOpen ? "secondary" : "default"}
                            size="sm"
                            onClick={() => setIsEditorOpen(!isEditorOpen)}
                            className="w-full text-xs justify-start gap-2"
                        >
                            <Edit className="w-3 h-3" />
                            {isEditorOpen ? 'ปิด' : 'แก้ไข'}
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    {subjectStats.map((subject) => (
                        <div
                            key={subject.name}
                            className={`w-20 bg-white border-2 ${subject.borderColor} rounded shadow-md overflow-hidden`}
                        >
                            {/* ... stats content ... */}
                            <div className={`${subject.color} text-white text-xs font-bold text-center py-1`}>
                                {subject.label}
                            </div>
                            <div className="px-2 py-1 border-b border-slate-200">
                                <div className="text-[10px] text-slate-600 leading-tight">ตอบ</div>
                                <div className="text-sm font-bold text-slate-800 leading-tight">
                                    {subject.answered} ข้อ
                                </div>
                            </div>
                            <div className="px-2 py-1">
                                <div className="text-[10px] text-slate-600 leading-tight">คะแนน</div>
                                <div className="text-sm font-bold text-slate-800 leading-tight">
                                    {subject.score}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Editor Panel - Rendered Conditionally as a sibling */}
                {isEditorOpen && (
                    <AnswerEditor
                        sheetId={sheetId!}
                        initialAnswers={overlay?.bottom?.answers || []}
                        isOpen={isEditorOpen}
                        onClose={() => setIsEditorOpen(false)}
                        onSaveSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['sheet-overlay', sheetId] });
                        }}
                    />
                )}
            </div>
        </div>
    );
}
