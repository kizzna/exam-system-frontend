/**
 * BatchProgressStream Component
 * Real-time batch progress visualization with SSE
 */

'use client';

import { useBatchStream, type ProcessingStage } from '@/lib/hooks/use-batch-stream';
import { translateLog } from '@/lib/utils/logTranslator';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface BatchProgressStreamProps {
  batchId: string;
  onComplete?: () => void;
}

const STAGE_LABELS: Record<ProcessingStage, string> = {
  uploading: 'กำลังอัปโหลดแบบแบ่งชิ้นส่วน',
  extracting: 'กำลังแตกไฟล์ zip',
  organizing_qr: 'กำลังแยกใบตอบตามใบนำสแกน (QR Code)',
  processing_sheets: 'กำลังตรวจใบตอบ',
  collecting_results: 'กำลังรวมผล',
  generating_csv: 'กำลังสร้างไฟล์ csv',
  loading_database: 'กำลังโหลดข้อมูล',
  cleanup: 'กำลังเก็บความเรียบร้อย',
  completed: 'เสร็จสิ้น',
  failed: 'ไม่สามารถดำเนินการ',
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

export function BatchProgressStream({ batchId, onComplete }: BatchProgressStreamProps) {
  const { events, currentEvent, isConnected, isComplete, error } = useBatchStream(batchId);

  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);

  // Monitor for duplicate task warnings
  useEffect(() => {
    if (currentEvent?.stage === 'extracting' && currentEvent.message.startsWith('Skipping')) {
      setDuplicateWarnings((prev) => {
        // Avoid duplicates if the same event is processed multiple times
        if (prev.includes(currentEvent.message)) return prev;
        return [...prev, currentEvent.message];
      });
    }
  }, [currentEvent]);



  // Call onComplete callback when batch completes
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  if (!batchId) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">สถานะการทำงาน</h3>
        <div className="flex items-center gap-2">
          {isConnected && !isComplete && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
              Live
            </div>
          )}
          {isComplete && !error && (
            <div className="text-sm font-medium text-green-600">✓ ทำงานเสร็จสิ้น</div>
          )}
          {error && <div className="text-sm font-medium text-red-600">✗ ทำงานไม่สำเร็จ</div>}
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
            <div>ความคืบหน้า: {currentEvent.progress_percentage.toFixed(1)}%</div>
            {currentEvent.sheets_total > 0 && (
              <div>
                จำนวนใบตอบ: {currentEvent.sheets_processed.toLocaleString()} /{' '}
                {currentEvent.sheets_total.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicate Task Warnings */}
      {duplicateWarnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {duplicateWarnings.map((msg, idx) => (
            <div key={idx} className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-yellow-600">⚠️</div>
                <div className="text-sm text-yellow-800">{msg}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Log */}
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-700">รายละเอียดการทำงาน</div>
        <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
          {events.length === 0 ? (
            <div className="py-8 text-center">
              {isConnected ? (
                <div className="text-sm text-gray-500">รอข้อมูลการทำงาน...</div>
              ) : isComplete ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-green-600">
                    ✅ ทำงานเสร็จสิ้น
                  </div>
                  <div className="text-xs text-gray-400">
                    ทำงานเสร็จสิ้นก่อนที่จะขอดูสถานะการทำงาน
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">ไม่พบข้อมูลการทำงาน</div>
                  <div className="text-xs text-gray-400">
                    ไม่พบสถานะข้อมูลการทำงาน
                  </div>
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
                  {event.progress_percentage > 0 && (
                    <div className="flex-shrink-0 text-xs text-gray-500">
                      {event.progress_percentage.toFixed(0)}%
                    </div>
                  )}
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
          {error.includes('Session expired') && (
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              โหลดหน้าใหม่
            </button>
          )}
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && !isComplete && (
        <div className="mt-4 text-center text-sm text-gray-500">กำลังเชื่อมต่อ Server...</div>
      )}
    </Card>
  );
}
