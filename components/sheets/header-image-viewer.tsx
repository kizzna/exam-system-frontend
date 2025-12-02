'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { sheetsApi } from '@/lib/api/sheets';
import { SmartImage, SmartImageItem } from './smart-image';
import { Loader2 } from 'lucide-react';

interface HeaderImageViewerProps {
    sheetId?: string;
}

export function HeaderImageViewer({ sheetId }: HeaderImageViewerProps) {
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

    if (!overlay?.top) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-100/50 h-full">
                <span className="text-slate-400 text-sm">No overlay data available</span>
            </div>
        );
    }

    const items: SmartImageItem[] = [];
    const { fields, current_values } = overlay.top;

    Object.entries(fields).forEach(([fieldName, coordinates]) => {
        let targetIndex = -1;

        if (fieldName === 'id_class_level') {
            const val = current_values.class_level;
            if (typeof val === 'number') {
                targetIndex = val - 1; // 1-based -> 0-based
            }
        } else if (fieldName === 'id_group_level') {
            const val = current_values.class_group;
            if (typeof val === 'number') {
                targetIndex = val - 1; // 1-based -> 0-based
            }
        } else if (fieldName.startsWith('id_exam_center_col_')) {
            const colIndex = parseInt(fieldName.replace('id_exam_center_col_', '')) - 1;
            const codeStr = current_values.exam_center_code?.toString().padStart(6, '0') || '';
            const digit = codeStr[colIndex];
            if (digit !== undefined) {
                targetIndex = parseInt(digit); // 0-9 maps to index 0-9
            }
        } else if (fieldName.startsWith('id_student_roll_col_')) {
            const colIndex = parseInt(fieldName.replace('id_student_roll_col_', '')) - 1;
            const rollStr = current_values.student_roll?.toString().padStart(5, '0') || '';
            const digit = rollStr[colIndex];
            if (digit !== undefined) {
                targetIndex = parseInt(digit); // 0-9 maps to index 0-9
            }
        }

        // Check if targetIndex is valid for the coordinates array
        if (targetIndex >= 0 && targetIndex < coordinates.length) {
            const match = coordinates[targetIndex];
            items.push({
                id: `${fieldName}-${targetIndex}`,
                x: match.x,
                y: match.y,
                type: 'circle',
                color: 'rgba(0, 255, 0, 0.4)', // Green for active
            });
        }
    });

    return (
        <SmartImage
            src={sheetsApi.getSheetImageUrl(sheetId, 'top')}
            width={overlay.top.dimensions.w}
            height={overlay.top.dimensions.h}
            items={items}
        />
    );
}
