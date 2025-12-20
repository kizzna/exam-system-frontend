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
            toast.success('ลบโปรไฟล์เรียบร้อย');
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            setDeleteProfile(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'ไม่สามารถลบโปรไฟล์ได้');
        },
    });

    const cloneMutation = useMutation({
        mutationFn: ({ id, name }: { id: number; name: string }) =>
            profilesAPI.clone(id, name),
        onSuccess: () => {
            toast.success('สร้างโปรไฟล์ใหม่เรียบร้อย');
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            setCloneProfile(null);
            setNewProfileName('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'ไม่สามารถสร้างโปรไฟล์ใหม่ได้');
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
            <div className="flex items-center justify-center gap-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">โปรไฟล์ตรวจข้อสอบ</h1>
                    <p className="text-muted-foreground">
                        จัดการโปรไฟล์และตั้งค่าการตรวจข้อสอบ
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/profiles/new">
                        <Plus className="mr-2 h-4 w-4" />
                        เพิ่มโปรไฟล์
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
                        <DialogTitle>สร้างโปรไฟล์ใหม่จาก {cloneProfile?.name}</DialogTitle>
                        <DialogDescription>
                            สร้างโปรไฟล์ใหม่จาก {cloneProfile?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">ชื่อโปรไฟล์ใหม่</Label>
                            <Input
                                id="name"
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                placeholder="ชื่อโปรไฟล์ใหม่"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCloneProfile(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmClone} disabled={cloneMutation.isPending || !newProfileName}>
                            {cloneMutation.isPending ? 'กำลังสร้าง...' : 'สร้างโปรไฟล์'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deleteProfile} onOpenChange={(open) => !open && setDeleteProfile(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ลบโปรไฟล์</DialogTitle>
                        <DialogDescription>
                            คุณต้องการลบโปรไฟล์ <strong>{deleteProfile?.name}</strong>? ไม่สามารถกู้คืนได้
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
                            {deleteMutation.isPending ? 'กำลังลบ...' : 'ลบโปรไฟล์'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
