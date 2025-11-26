'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { masterDataApi } from '@/lib/api/master-data';
import { UserScope, ScopeFilter } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

interface ScopeManagerProps {
    scopes: UserScope[];
    onChange: (scopes: UserScope[]) => void;
}

export function ScopeManager({ scopes, onChange }: ScopeManagerProps) {
    const { data: evalCenters } = useQuery({
        queryKey: ['evaluation-centers'],
        queryFn: masterDataApi.getEvaluationCenters,
    });

    // Fetch SNRs - assuming we can fetch all or need a parent part. 
    // The guide says "GET /api/master-data/snrs", but previously it required parent_part_id.
    // For now, let's assume we can fetch all or maybe we need to pick a part first.
    // To simplify, let's assume we might need to fetch SNRs based on some selection or just fetch all if API supports it.
    // If API requires parent_part_id, this UI might need to be more complex (select Hon -> Part -> SNR).
    // Let's check masterDataApi again or assume for now we can list them.
    // Actually, let's just implement Eval Center support fully first as per example.

    const addScope = () => {
        onChange([
            ...scopes,
            {
                scope_type: 'eval_center',
                scope_id: 0,
                filters: {},
            },
        ]);
    };

    const removeScope = (index: number) => {
        const newScopes = [...scopes];
        newScopes.splice(index, 1);
        onChange(newScopes);
    };

    const updateScope = (index: number, updates: Partial<UserScope>) => {
        const newScopes = [...scopes];
        newScopes[index] = { ...newScopes[index], ...updates };
        onChange(newScopes);
    };

    const updateFilter = (index: number, updates: Partial<ScopeFilter>) => {
        const newScopes = [...scopes];
        newScopes[index] = {
            ...newScopes[index],
            filters: { ...newScopes[index].filters, ...updates },
        };
        onChange(newScopes);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Scopes</Label>
                <Button type="button" variant="outline" size="sm" onClick={addScope}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Scope
                </Button>
            </div>

            {scopes.map((scope, index) => (
                <Card key={index}>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="grid grid-cols-2 gap-4 flex-1 mr-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={scope.scope_type}
                                        onValueChange={(value) =>
                                            updateScope(index, { scope_type: value as 'eval_center' | 'snr_authority' })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="eval_center">Evaluation Center</SelectItem>
                                            <SelectItem value="snr_authority">SNR Authority</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Context</Label>
                                    {scope.scope_type === 'eval_center' ? (
                                        <Select
                                            value={scope.scope_id.toString()}
                                            onValueChange={(value) => updateScope(index, { scope_id: parseInt(value) })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Center" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {evalCenters?.map((center) => (
                                                    <SelectItem key={center.id} value={center.id.toString()}>
                                                        {center.name} ({center.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            type="number"
                                            placeholder="SNR ID"
                                            value={scope.scope_id || ''}
                                            onChange={(e) => updateScope(index, { scope_id: parseInt(e.target.value) })}
                                        />
                                    )}
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => removeScope(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label>Class Levels</Label>
                            <div className="flex flex-wrap gap-4">
                                {[1, 2, 3, 4, 5, 6].map((level) => (
                                    <div key={level} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={scope.filters.class_levels?.includes(level)}
                                            onCheckedChange={(checked) => {
                                                const current = scope.filters.class_levels || [];
                                                const updated = checked
                                                    ? [...current, level]
                                                    : current.filter((l) => l !== level);
                                                updateFilter(index, { class_levels: updated });
                                            }}
                                        />
                                        <Label className="font-normal">Class {level}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Exam Centers Include/Ranges could be added here if needed */}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
