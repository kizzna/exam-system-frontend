'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Profile, CreateProfileRequest } from '@/lib/types/profiles';
import { toast } from 'sonner';

const profileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    config_json: z.string().refine(
        (val) => {
            try {
                JSON.parse(val);
                return true;
            } catch (e) {
                return false;
            }
        },
        { message: 'Invalid JSON format' }
    ),
    is_default: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    initialData?: Profile;
    onSubmit: (data: CreateProfileRequest) => void;
    isLoading?: boolean;
}

export function ProfileForm({ initialData, onSubmit, isLoading }: ProfileFormProps) {
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            config_json: initialData
                ? JSON.stringify(initialData.config_json, null, 2)
                : '{\n  "bubble_detection": {\n    "darkness_empty_threshold": 0.35,\n    "grid_density_min_threshold": 10.0\n  }\n}',
            is_default: initialData?.is_default || false,
        },
    });

    const handleSubmit = (values: ProfileFormValues) => {
        try {
            const config = JSON.parse(values.config_json);
            onSubmit({
                name: values.name,
                description: values.description,
                config_json: config,
                is_default: values.is_default,
            });
        } catch (e) {
            toast.error('Invalid JSON configuration');
        }
    };

    const formatJson = () => {
        try {
            const current = form.getValues('config_json');
            const parsed = JSON.parse(current);
            form.setValue('config_json', JSON.stringify(parsed, null, 2));
            toast.success('JSON formatted');
        } catch (e) {
            toast.error('Cannot format invalid JSON');
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Profile Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Light-Filled Sheets" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Optional description of this profile"
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="is_default"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Set as Default Profile</FormLabel>
                                            <FormDescription>
                                                This profile will be pre-selected for new batch uploads.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="config_json"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Configuration (JSON)</FormLabel>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={formatJson}
                                            >
                                                Format JSON
                                            </Button>
                                        </div>
                                        <FormControl>
                                            <Textarea
                                                placeholder="{ ... }"
                                                className="font-mono min-h-[300px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Enter the OMR configuration overrides in JSON format.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : initialData ? 'Update Profile' : 'Create Profile'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
