'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesAPI } from '@/lib/api/profiles';
import { ProfileForm } from '@/components/profiles/ProfileForm';
import { CreateProfileRequest } from '@/lib/types/profiles';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateProfilePage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: profilesAPI.create,
        onSuccess: () => {
            toast.success('Profile created successfully');
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            router.push('/dashboard/profiles');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to create profile');
        },
    });

    const handleSubmit = (data: CreateProfileRequest) => {
        createMutation.mutate(data);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/profiles">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Profile</h1>
                    <p className="text-muted-foreground">
                        Create a new OMR processing profile.
                    </p>
                </div>
            </div>

            <ProfileForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
        </div>
    );
}
