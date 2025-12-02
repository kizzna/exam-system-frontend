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

export function AnswerImageViewer({ sheetId }: AnswerImageViewerProps) {
    const { data: overlay, isLoading } = useQuery({
        queryKey: ['sheet-overlay', sheetId],
        queryFn: () => sheetsApi.getOverlay(sheetId!),
        enabled: !!sheetId,
    });

    // Calculate statistics per subject (must be before conditional returns)
    const subjectStats = useMemo(() => {
        if (!overlay?.bottom?.answers) return [];

        return SUBJECTS.map((subject) => {
            const [start, end] = subject.range;
            const subjectAnswers = overlay.bottom.answers.filter(
                (ans) => ans.q >= start && ans.q <= end
            );

            const answered = subjectAnswers.filter(
                (ans) => ans.val !== null && ans.val !== undefined && ans.val !== '' && ans.val !== 0
            ).length;

            const correct = subjectAnswers.filter(
                (ans) => ans.val == ans.correct_val
            ).length;

            const incorrect = subjectAnswers.filter(
                (ans) => ans.val !== null && ans.val !== undefined && ans.val !== '' && ans.val !== 0 && ans.val != ans.correct_val
            ).length;

            const score = overlay.top?.scores?.[subject.name] || 0;

            return {
                ...subject,
                answered,
                correct,
                incorrect,
                score,
            };
        });
    }, [overlay]);

    // Calculate items for overlay (must be before conditional returns)
    const items: SmartImageItem[] = useMemo(() => {
        if (!overlay?.bottom?.answers) return [];

        return overlay.bottom.answers.flatMap((ans) => {
            const resultItems: SmartImageItem[] = [];
            let type: SmartImageItem['type'] = 'neutral';

            // Logic:
            // 1. Correct Icon (Student Answered Correctly) -> val == correct_val
            // 2. Incorrect Icon (Student Answered Incorrectly) -> val != correct_val && val is present (not 0)
            // 3. Neutral Icon (Student Did Not Answer) -> val is empty/null/0

            if (ans.val == ans.correct_val) {
                type = 'correct';

                // Workaround: If student answer is correct but student coords are missing (backend bug),
                // use the correct_coords to show the green checkmark.
                if (!ans.coords && ans.correct_coords) {
                    resultItems.push({
                        id: `q-${ans.q}-fallback`,
                        x: ans.correct_coords.x,
                        y: ans.correct_coords.y,
                        type: 'correct',
                    });
                }
            } else if (ans.val !== null && ans.val !== undefined && ans.val !== '' && ans.val !== 0) {
                type = 'incorrect';

                // If incorrect, also show the correct answer if coordinates are available
                if (ans.correct_coords) {
                    resultItems.push({
                        id: `q-${ans.q}-correct`,
                        x: ans.correct_coords.x,
                        y: ans.correct_coords.y,
                        type: 'correct', // Green check/circle on the correct answer
                    });
                }
            } else {
                type = 'neutral';

                // If neutral (not answered), show the correct answer location as neutral (blue circle)
                // This indicates "Here is where you should have answered"
                if (ans.correct_coords) {
                    resultItems.push({
                        id: `q-${ans.q}-missing`,
                        x: ans.correct_coords.x,
                        y: ans.correct_coords.y,
                        type: 'neutral',
                    });
                }
            }

            if (ans.coords) {
                resultItems.push({
                    id: `q-${ans.q}`,
                    x: ans.coords.x,
                    y: ans.coords.y,
                    type: type,
                });
            }

            return resultItems;
        });
    }, [overlay]);

    if (!sheetId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-100/50 h-full">
                <span className="text-slate-400 text-sm">Select a sheet to view</span>
            </div>
        );
    }

    if (isLoading) {
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
                        src={sheetsApi.getSheetImageUrl(sheetId, 'bottom')}
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
