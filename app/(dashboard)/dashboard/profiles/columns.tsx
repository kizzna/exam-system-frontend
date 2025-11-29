'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Profile } from '@/lib/types/profiles';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Copy, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export type ProfileActionsProps = {
    profile: Profile;
    onClone: (profile: Profile) => void;
    onDelete: (profile: Profile) => void;
};

export const columns = ({
    onClone,
    onDelete,
}: {
    onClone: (profile: Profile) => void;
    onDelete: (profile: Profile) => void;
}): ColumnDef<Profile>[] => [
        {
            accessorKey: 'id',
            header: 'ID',
        },
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            accessorKey: 'description',
            header: 'Description',
        },
        {
            accessorKey: 'is_default',
            header: 'Default',
            cell: ({ row }) => {
                return row.original.is_default ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Yes
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        No
                    </span>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Created At',
            cell: ({ row }) => {
                return new Date(row.original.created_at).toLocaleDateString();
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const profile = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/profiles/${profile.id}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onClone(profile)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Clone
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(profile)}
                                className="text-red-600"
                                disabled={profile.is_default}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
