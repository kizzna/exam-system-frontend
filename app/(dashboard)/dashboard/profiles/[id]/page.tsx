'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesAPI } from '@/lib/api/profiles';
import { ProfileForm } from '@/components/profiles/ProfileForm';
import { CreateProfileRequest } from '@/lib/types/profiles';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);
    const queryClient = useQueryClient();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile', id],
        queryFn: () => profilesAPI.get(id),
        enabled: !!id,
    });

    const updateMutation = useMutation({
        mutationFn: (data: CreateProfileRequest) => profilesAPI.update(id, data),
        onSuccess: () => {
            toast.success('Profile updated successfully');
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            queryClient.invalidateQueries({ queryKey: ['profile', id] });
            router.push('/dashboard/profiles');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to update profile');
        },
    });

    const handleSubmit = (data: CreateProfileRequest) => {
        updateMutation.mutate(data);
    };

    if (isLoading) {
        return <div>Loading profile...</div>;
    }

    if (!profile) {
        return <div>Profile not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/profiles">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
                    <p className="text-muted-foreground">
                        Edit profile <strong>{profile.name}</strong>.
                    </p>
                </div>
            </div>

            <ProfileForm
                initialData={profile}
                onSubmit={handleSubmit}
                isLoading={updateMutation.isPending}
            />
        </div>
    );
}
