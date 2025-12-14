'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Save, X, Loader2 } from 'lucide-react'; // Added X icon
import { sheetsApi } from '@/lib/api/sheets';
import { toast } from 'sonner';

interface AnswerEditorProps {
    sheetId: string;
    initialAnswers: { q: number; val: number | null }[];
    isOpen: boolean;
    onClose: () => void; // Changed from onOpenChange to onClose
    onSaveSuccess: () => void;
}

const BITMASK_MAP: Record<string, number> = {
    'A': 1, '1': 1, 'ก': 1,
    'B': 2, '2': 2, 'ข': 2,
    'C': 4, '3': 4, 'ค': 4,
    'D': 8, '4': 8, 'ง': 8,
};

const REVERSE_MAP: Record<number, string> = {
    1: 'ก', 2: 'ข', 4: 'ค', 8: 'ง',
};

export function AnswerEditor({ sheetId, initialAnswers, isOpen, onClose, onSaveSuccess }: AnswerEditorProps) {
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    // Initialize answers
    useEffect(() => {
        if (isOpen && initialAnswers) {
            const initialMap: Record<number, number> = {};
            for (let i = 1; i <= 150; i++) {
                initialMap[i] = 0;
            }
            initialAnswers.forEach(a => {
                if (a.val !== null) initialMap[a.q] = a.val;
            });
            setAnswers(initialMap);
        }
    }, [isOpen, initialAnswers]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        const qNum = parseInt(query);
        if (!isNaN(qNum) && qNum >= 1 && qNum <= 150) {
            const el = itemRefs.current[qNum];
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, qNum: number) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextQ = qNum + 1;
            if (nextQ <= 150) inputRefs.current[nextQ]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevQ = qNum - 1;
            if (prevQ >= 1) inputRefs.current[prevQ]?.focus();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const nextQ = qNum + 1;
            if (nextQ <= 150) inputRefs.current[nextQ]?.focus();
        }
    };

    const handleInputChange = (val: string, qNum: number) => {
        if (!val) {
            setAnswers(prev => ({ ...prev, [qNum]: 0 }));
            return;
        }
        const upperVal = val.toUpperCase();
        const lastChar = upperVal.slice(-1);

        if (BITMASK_MAP[lastChar] !== undefined) {
            setAnswers(prev => ({ ...prev, [qNum]: BITMASK_MAP[lastChar] }));
        }
    };

    const handleSave = async (qNum: number) => {
        try {
            setIsSaving(true);
            const val = answers[qNum];
            await sheetsApi.updateSheetAnswers(sheetId, { answers: { [qNum]: val } });
            toast.success(`Saved Q${qNum}`);
            onSaveSuccess();
        } catch (error) {
            toast.error("Failed to save answer.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAll = async () => {
        try {
            setIsSaving(true);
            const payload: Record<string, number> = {};
            Object.entries(answers).forEach(([k, v]) => {
                payload[k] = v;
            });
            await sheetsApi.updateSheetAnswers(sheetId, { answers: payload });
            toast.success("All answers saved.");
            onSaveSuccess();
        } catch (error) {
            toast.error("Failed to save all.");
        } finally {
            setIsSaving(false);
        }
    };

    // If not open, render nothing (or you can use CSS display:none if you want to preserve state)
    if (!isOpen) return null;

    return (
        <div className="w-[140px] h-full flex flex-col bg-white border-l border-slate-200 shadow-xl flex-shrink-0 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-1 border-b flex items-center gap-1 bg-slate-50 justify-between">
                <div className="flex items-center gap-1">
                    <Input
                        placeholder="ไปข้อ..."
                        className="h-7 text-[10px] px-1 w-14"
                        value={searchQuery}
                        onChange={handleSearch}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                const q = parseInt(searchQuery) || 1;
                                inputRefs.current[q]?.focus();
                            }
                        }}
                    />
                </div>
                <div className="flex items-center gap-0.5">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        title="บันทึกทุกข้อ"
                    >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-2 space-y-1">
                    {Array.from({ length: 150 }, (_, i) => i + 1).map(qNum => (
                        <div
                            key={qNum}
                            ref={el => { itemRefs.current[qNum] = el }}
                            className="flex items-center gap-2 text-sm p-1 hover:bg-slate-50 rounded"
                        >
                            <span className="w-6 font-mono text-slate-500 text-right">{qNum}.</span>
                            <div className="flex-1">
                                <Input
                                    ref={(el) => { inputRefs.current[qNum] = el; }}
                                    className="h-7 w-10 text-center font-bold transition-colors focus:bg-blue-50"
                                    value={REVERSE_MAP[answers[qNum]] || (answers[qNum] === 0 ? '' : '?')}

                                    // Logic remains the same
                                    onChange={(e) => handleInputChange(e.target.value, qNum)}
                                    onKeyDown={(e) => handleKeyDown(e, qNum)}

                                    // ✅ NEW: Automatically select text on focus
                                    onFocus={(e) => e.target.select()}

                                    maxLength={1}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleSave(qNum)}
                                disabled={isSaving}
                                tabIndex={-1}
                            >
                                <Save className="w-3 h-3 text-slate-400 hover:text-blue-500" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}