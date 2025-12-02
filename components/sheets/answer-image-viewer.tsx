'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { sheetsApi } from '@/lib/api/sheets';
import { SmartImage, SmartImageItem } from './smart-image';
import { Loader2 } from 'lucide-react';

interface AnswerImageViewerProps {
    sheetId?: string;
}

export function AnswerImageViewer({ sheetId }: AnswerImageViewerProps) {
    const { data: overlay, isLoading } = useQuery({
        queryKey: ['sheet-overlay', sheetId],
        queryFn: () => sheetsApi.getOverlay(sheetId!),
        enabled: !!sheetId,
    });

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

    const items: SmartImageItem[] = overlay.bottom.answers.flatMap((ans) => {
        const resultItems: SmartImageItem[] = [];
        let type: SmartImageItem['type'] = 'neutral';

        // Logic:
        // 1. Correct Icon (Student Answered Correctly) -> val == correct_val
        // 2. Incorrect Icon (Student Answered Incorrectly) -> val != correct_val && val is present
        // 3. Neutral Icon (Student Did Not Answer) -> val is empty/null

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
        } else if (ans.val !== null && ans.val !== undefined && ans.val !== '') {
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

                {/* Score Display - Right Side (Outside of Image) */}
                {overlay.top?.scores && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                        {Object.entries(overlay.top.scores).map(([subject, score]) => (
                            <div
                                key={subject}
                                className="w-12 h-12 bg-white border-2 border-slate-800 rounded flex items-center justify-center shadow-md"
                                title={subject}
                            >
                                <span className="font-bold text-lg text-slate-800">{score}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
