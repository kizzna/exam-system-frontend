'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sheetsApi } from '@/lib/api/sheets';
import { SmartImage, SmartImageItem } from './smart-image';
import { Loader2 } from 'lucide-react';

interface AnswerImageViewerProps {
    sheetId?: string;
}

// Subject configuration: question ranges and colors
const SUBJECTS = [
    { name: 'subject1', label: 'วิชา ธรรม', range: [1, 50], color: 'bg-blue-500', borderColor: 'border-blue-600' },
    { name: 'subject2', label: 'วิชา พุทธ', range: [51, 100], color: 'bg-green-500', borderColor: 'border-green-600' },
    { name: 'subject3', label: 'วิชา วินัย', range: [101, 150], color: 'bg-orange-500', borderColor: 'border-orange-600' },
];

export function AnswerImageViewer({ sheetId, taskId }: AnswerImageViewerProps & { taskId: string }) {
    const { data: overlay, isLoading: isLoadingOverlay } = useQuery({
        queryKey: ['sheet-overlay', sheetId],
        queryFn: () => sheetsApi.getOverlay(sheetId!),
        enabled: !!sheetId,
    });

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
        if (!overlay?.bottom?.answers || !answerKey) return [];

        return SUBJECTS.map((subject) => {
            const [start, end] = subject.range;
            const subjectAnswers = overlay.bottom.answers.filter(
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
        if (!overlay?.bottom?.answers || !layout?.questions || !layout?.config?.bottom || !answerKey) return [];

        const items: SmartImageItem[] = [];
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
            if (ans.val !== null && ans.val !== undefined && ans.val !== 0) {
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
                            items.push({
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
            if (correctVal !== undefined && (ans.val !== correctVal)) {
                const values = [1, 2, 4, 8, 16];
                const options = ['A', 'B', 'C', 'D', 'E'];

                values.forEach((val, idx) => {
                    if ((correctVal & val) === val) {
                        const option = options[idx];
                        const coord = questionCoords[option];
                        if (coord) {
                            const { x, y } = transform(coord.x, coord.y);
                            // If student didn't answer, show neutral (blue), else show correct (green)
                            // The user's logic had 'neutral' for missing answers.
                            // Let's stick to: Green circle for correct answer location.
                            items.push({
                                id: `q_${qNum}_correct`,
                                x,
                                y,
                                type: 'circle',
                                color: 'rgba(0, 0, 255, 0.8)', // Blue Circle
                                lineWidth: 2
                            });
                        }
                    }
                });
            }
        });

        return items;
    }, [overlay, layout, answerKey]);

    if (!sheetId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-100/50 h-full">
                <span className="text-slate-400 text-sm">Select a sheet to view</span>
            </div>
        );
    }

    if (isLoadingOverlay || isLoadingLayout || isLoadingAnswerKey) {
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
        <div className="w-full h-full flex items-start justify-start bg-slate-100/50 p-4">
            <div className="flex items-start gap-2 h-full">
                <div className="h-full flex-shrink-0">
                    <SmartImage
                        src={sheetsApi.getSheetImageUrl(sheetId, 'bottom', 350)}
                        width={overlay.bottom.dimensions.w}
                        height={overlay.bottom.dimensions.h}
                        items={items}
                        alignment="left"
                    />
                </div>

                {/* Subject Statistics Display - Right Side (Outside of Image) */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                    {subjectStats.map((subject) => (
                        <div
                            key={subject.name}
                            className={`w-20 bg-white border-2 ${subject.borderColor} rounded shadow-md overflow-hidden`}
                        >
                            {/* Subject Header */}
                            <div className={`${subject.color} text-white text-xs font-bold text-center py-1`}>
                                {subject.label}
                            </div>

                            {/* Answered Count */}
                            <div className="px-2 py-1 border-b border-slate-200">
                                <div className="text-[10px] text-slate-600 leading-tight">ตอบ</div>
                                <div className="text-sm font-bold text-slate-800 leading-tight">
                                    {subject.answered} ข้อ
                                </div>
                            </div>

                            {/* Score */}
                            <div className="px-2 py-1">
                                <div className="text-[10px] text-slate-600 leading-tight">คะแนน</div>
                                <div className="text-sm font-bold text-slate-800 leading-tight">
                                    {subject.score}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
