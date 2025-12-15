/**
 * ReprocessTaskStream Component
 * Real-time reprocess task progress visualization with SSE
 */

'use client';

import { useReprocessTaskStream, type ProcessingStage } from '@/lib/hooks/use-reprocess-task-stream';
import { translateLog } from '@/lib/utils/logTranslator';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface ReprocessTaskStreamProps {
    taskId: string;
    onComplete?: () => void;
}

const STAGE_LABELS: Record<ProcessingStage, string> = {
    uploading: 'Uploading Data',
    extracting: 'Preparing Data',
    organizing_qr: 'Organizing',
    processing_sheets: 'Reprocessing OMR',
    collecting_results: 'Collecting Results',
    generating_csv: 'Updating Records',
    loading_database: 'Saving Changes',
    cleanup: 'Cleanup',
    completed: 'Completed',
    failed: 'Failed',
};

const STAGE_COLORS: Record<ProcessingStage, string> = {
    uploading: 'text-blue-600',
    extracting: 'text-purple-600',
    organizing_qr: 'text-indigo-600',
    processing_sheets: 'text-green-600',
    collecting_results: 'text-orange-600',
    generating_csv: 'text-pink-600',
    loading_database: 'text-red-600',
    cleanup: 'text-gray-600',
    completed: 'text-green-700',
    failed: 'text-red-700',
};

function formatDuration(seconds: number): string {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
}

export function ReprocessTaskStream({ taskId, onComplete }: ReprocessTaskStreamProps) {
    const { events, currentEvent, isConnected, isComplete, error } = useReprocessTaskStream(taskId);

    // Call onComplete callback when task completes
    useEffect(() => {
        if (isComplete && onComplete) {
            onComplete();
        }
    }, [isComplete, onComplete]);

    if (!taskId) {
        return null;
    }

    return (
        <Card className="p-4 border-0 shadow-none">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Processing Progress</h3>
                <div className="flex items-center gap-2">
                    {isConnected && !isComplete && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
                            Live
                        </div>
                    )}
                    {isComplete && !error && (
                        <div className="text-sm font-medium text-green-600">✓ Complete</div>
                    )}
                    {error && <div className="text-sm font-medium text-red-600">✗ Failed</div>}
                </div>
            </div>

            {/* Current Stage Summary */}
            {currentEvent && !isComplete && (
                <div className="mb-4 rounded-lg bg-blue-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                        <div className={`font-medium ${STAGE_COLORS[currentEvent.stage]}`}>
                            {STAGE_LABELS[currentEvent.stage]}
                        </div>
                        <div className="text-sm text-gray-600">
                            {formatDuration(currentEvent.elapsed_seconds)}
                        </div>
                    </div>
                    <div className="mb-2 text-sm text-gray-700">{translateLog(currentEvent.message)}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div>Progress: {currentEvent.progress_percentage.toFixed(1)}%</div>
                        {currentEvent.sheets_total > 0 && (
                            <div>
                                Sheets: {currentEvent.sheets_processed.toLocaleString()} /{' '}
                                {currentEvent.sheets_total.toLocaleString()}
                            </div>
                        )}
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-200">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${currentEvent.progress_percentage}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Activity Log */}
            <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">Activity Log</div>
                <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {events.length === 0 ? (
                        <div className="py-8 text-center">
                            {isConnected ? (
                                <div className="text-sm text-gray-500">Waiting for progress updates...</div>
                            ) : isComplete ? (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-green-600">
                                        ✓ Task completed successfully
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-sm text-gray-500">Initializing...</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {events.map((event, index) => (
                                <div key={index} className="flex gap-3 text-sm">
                                    <div className="flex-shrink-0 font-mono text-xs text-gray-500">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </div>
                                    <div className="flex-shrink-0 font-mono text-xs text-gray-400">
                                        {formatDuration(event.elapsed_seconds)}
                                    </div>
                                    <div className={`flex-1 ${STAGE_COLORS[event.stage]}`}>
                                        <span className="font-medium">[{STAGE_LABELS[event.stage]}]</span>{' '}
                                        {translateLog(event.message)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Error Details */}
            {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="mb-1 font-medium text-red-900">Error</div>
                    <div className="text-sm text-red-700">{error}</div>
                </div>
            )}
        </Card>
    );
}
