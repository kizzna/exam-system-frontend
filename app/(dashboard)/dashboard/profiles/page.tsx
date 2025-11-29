'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesAPI } from '@/lib/api/profiles';
import { Profile } from '@/lib/types/profiles';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { PaginationState } from '@tanstack/react-table';

export default function ProfilesPage() {
    const queryClient = useQueryClient();
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    // Dialog states
    const [cloneProfile, setCloneProfile] = useState<Profile | null>(null);
    const [deleteProfile, setDeleteProfile] = useState<Profile | null>(null);
    const [newProfileName, setNewProfileName] = useState('');

    // Fetch profiles
    const { data: profiles = [], isLoading } = useQuery({
        queryKey: ['profiles'],
        queryFn: profilesAPI.getAll,
    });

    // Client-side pagination logic
    const paginatedData = useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize;
        const end = start + pagination.pageSize;
        return profiles.slice(start, end);
    }, [profiles, pagination]);

    const pageCount = Math.ceil(profiles.length / pagination.pageSize);

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: profilesAPI.delete,
        onSuccess: () => {
            toast.success('Profile deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            setDeleteProfile(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to delete profile');
        },
    });

    const cloneMutation = useMutation({
        mutationFn: ({ id, name }: { id: number; name: string }) =>
            profilesAPI.clone(id, name),
        onSuccess: () => {
            toast.success('Profile cloned successfully');
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            setCloneProfile(null);
            setNewProfileName('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Failed to clone profile');
        },
    });

    // Handlers
    const handleCloneClick = (profile: Profile) => {
        setCloneProfile(profile);
        setNewProfileName(`${profile.name} (Copy)`);
    };

    const handleDeleteClick = (profile: Profile) => {
        setDeleteProfile(profile);
    };

    const handleConfirmClone = () => {
        if (cloneProfile && newProfileName) {
            cloneMutation.mutate({ id: cloneProfile.id, name: newProfileName });
        }
    };

    const handleConfirmDelete = () => {
        if (deleteProfile) {
            deleteMutation.mutate(deleteProfile.id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profiles</h1>
                    <p className="text-muted-foreground">
                        Manage OMR processing profiles and configurations.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/profiles/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Profile
                    </Link>
                </Button>
            </div>

            <DataTable
                columns={columns({
                    onClone: handleCloneClick,
                    onDelete: handleDeleteClick,
                })}
                data={paginatedData}
                pageCount={pageCount}
                pagination={pagination}
                onPaginationChange={setPagination}
                isLoading={isLoading}
            />

            {/* Clone Dialog */}
            <Dialog open={!!cloneProfile} onOpenChange={(open) => !open && setCloneProfile(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clone Profile</DialogTitle>
                        <DialogDescription>
                            Create a copy of <strong>{cloneProfile?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">New Profile Name</Label>
                            <Input
                                id="name"
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                placeholder="Enter new profile name"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCloneProfile(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmClone} disabled={cloneMutation.isPending || !newProfileName}>
                            {cloneMutation.isPending ? 'Cloning...' : 'Clone Profile'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deleteProfile} onOpenChange={(open) => !open && setDeleteProfile(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Profile</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleteProfile?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteProfile(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Profile'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
