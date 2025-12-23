'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sheetsApi } from '@/lib/api/sheets';
import { SmartImage, SmartImageItem } from './smart-image';
import { Loader2, FileImage, ScanLine } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderImageViewerProps {
    sheetId?: string;
    refreshKey?: number;
}

export function HeaderImageViewer({ sheetId, refreshKey, optimisticValues }: HeaderImageViewerProps & { optimisticValues?: Record<string, any> }) {
    const { data: overlay, isLoading } = useQuery({
        queryKey: ['sheet-overlay', sheetId],
        queryFn: () => sheetsApi.getOverlay(sheetId!),
        enabled: !!sheetId,
    });

    const { data: layout } = useQuery({
        queryKey: ['omr-layout'],
        queryFn: () => sheetsApi.getLayout(),
        staleTime: Infinity, // Layout is static
    });

    const items: SmartImageItem[] = useMemo(() => {
        if (!overlay?.top?.values || !layout?.header_layout || !layout?.config?.top) return [];

        const { values } = overlay.top;
        const { header_layout, config } = layout;
        const items: SmartImageItem[] = [];

        // Coordinate Transformation Logic
        // 1. Get Crop Config
        const { crop_x, crop_y } = config.top;

        // Helper to transform coordinates: (AbsX, AbsY) -> (RelX, RelY)
        const transform = (absX: number, absY: number) => {
            const relX = absX - crop_x;
            const relY = absY - crop_y;
            return {
                x: relX,
                y: relY
            };
        };

        // 1. Class Level (Single Bubble)
        if (header_layout.id_class_level && values.class_level) {
            const val = typeof values.class_level === 'number' ? values.class_level : parseInt(values.class_level as string);
            // 1-based value -> 0-based index
            const bubbleIndex = val - 1;
            const bubble = header_layout.id_class_level[bubbleIndex];

            if (bubble) {
                const { x, y } = transform(bubble.x, bubble.y);
                items.push({
                    id: 'class_level',
                    x,
                    y,
                    type: 'circle',
                    color: 'rgba(0, 255, 0, 0.4)',
                });
            }
        }

        // 2. Class Group (Single Bubble)
        if (header_layout.id_group_level && values.class_group) {
            const val = typeof values.class_group === 'number' ? values.class_group : parseInt(values.class_group as string);
            // 1-based value -> 0-based index
            const bubbleIndex = val - 1;
            const bubble = header_layout.id_group_level[bubbleIndex];

            if (bubble) {
                const { x, y } = transform(bubble.x, bubble.y);
                items.push({
                    id: 'class_group',
                    x,
                    y,
                    type: 'circle',
                    color: 'rgba(0, 255, 0, 0.4)',
                });
            }
        }

        // 3. Exam Center (Multi-digit)
        // Layout has id_exam_center_col_1 to id_exam_center_col_6
        if (values.exam_center) {
            const valStr = values.exam_center.toString().padStart(6, '0');
            for (let i = 0; i < 6; i++) {
                const digit = parseInt(valStr[i]);
                const colKey = `id_exam_center_col_${i + 1}`;
                const bubbles = header_layout[colKey];

                if (bubbles && bubbles[digit]) {
                    const { x, y } = transform(bubbles[digit].x, bubbles[digit].y);
                    items.push({
                        id: `exam_center_${i}`,
                        x,
                        y,
                        type: 'circle',
                        color: 'rgba(0, 255, 0, 0.4)',
                    });
                }
            }
        }

        // 4. Student Roll (Multi-digit)
        // Layout has id_student_roll_col_1 to id_student_roll_col_5
        if (values.student_roll) {
            // Check for optimistic value (snappy update)
            const currentRoll = optimisticValues?.student_roll ?? values.student_roll;
            const valStr = currentRoll.toString().padStart(5, '0');

            for (let i = 0; i < 5; i++) {
                const digit = parseInt(valStr[i]);
                const colKey = `id_student_roll_col_${i + 1}`;
                const bubbles = header_layout[colKey];

                if (bubbles && bubbles[digit]) {
                    const { x, y } = transform(bubbles[digit].x, bubbles[digit].y);
                    items.push({
                        id: `student_roll_${i}`,
                        x,
                        y,
                        type: 'circle',
                        color: 'rgba(0, 255, 0, 0.4)',
                    });
                }
            }
        }

        // 5. Student Name (Text)
        if (overlay.student_name) {
            const { value, x, y } = overlay.student_name;
            const transformed = transform(x, y);
            items.push({
                id: 'student_name',
                x: transformed.x,
                y: transformed.y,
                type: 'text',
                text: value,
                color: 'blue',
                fontSize: '2rem', // ~h4
            });
        }

        return items;
    }, [overlay, layout, optimisticValues]);

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

    if (!overlay?.top) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-100/50 h-full">
                <span className="text-slate-400 text-sm">No overlay data available</span>
            </div>
        );
    }

    if (!overlay || !layout) return <div className="animate-pulse bg-slate-200 w-full h-full" />;

    return (
        <SmartImage
            src={sheetsApi.getSheetImageUrl(sheetId, 'top', 920, refreshKey)}
            width={overlay.top.dimensions.w}
            height={overlay.top.dimensions.h}
            items={items}
        >
            <TooltipProvider>
                <div
                    className="absolute flex gap-1"
                    style={{
                        left: `${(770 / overlay.top.dimensions.w) * 100}%`,
                        top: `${(380 / overlay.top.dimensions.h) * 100}%`,
                    }}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <a
                                href={sheetsApi.getSheetImageUrl(sheetId, 'original', undefined, refreshKey)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-8 h-8 bg-white/90 hover:bg-white rounded shadow-sm border border-slate-200 transition-colors"
                            >
                                <FileImage className="w-8 h-8 text-slate-700" />
                            </a>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>ต้นฉบับ</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <a
                                href={sheetsApi.getSheetImageUrl(sheetId, 'aligned', undefined, refreshKey)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-8 h-8 bg-white/90 hover:bg-white rounded shadow-sm border border-slate-200 transition-colors"
                            >
                                <FileImage className="w-8 h-8 text-blue-700" />
                            </a>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>ประมวลผลแล้ว</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        </SmartImage>
    );
}

