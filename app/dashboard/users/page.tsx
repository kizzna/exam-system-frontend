'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { User, CreateUserRequest, UpdateUserRequest } from '@/lib/types/users';
import { useAuth } from '@/lib/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Key, ChevronLeft, ChevronRight } from 'lucide-react';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest & { is_active?: boolean }>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role_hierarchy: 3,
    is_active: true,
  });

  // Fetch users with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page],
    queryFn: () => usersApi.getUsers({ page, page_size: 20 }),
    enabled: isAdmin,
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: UpdateUserRequest }) =>
      usersApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role_hierarchy: 3,
      is_active: true,
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditUser = (user: User) => {
    const roleValue =
      user.hierarchy_level === 'global'
        ? 0
        : user.hierarchy_level === 'order'
          ? 1
          : user.hierarchy_level === 'region'
            ? 2
            : 3;

    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      full_name: user.full_name,
      role_hierarchy: roleValue,
      is_active: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Convert role_hierarchy number to hierarchy_level string
    const hierarchyLevelMap: { [key: number]: 'global' | 'order' | 'region' | 'organization' } = {
      0: 'global',
      1: 'order',
      2: 'region',
      3: 'organization',
    };

    const updateData: UpdateUserRequest = {
      email: formData.email || selectedUser.email,
      full_name: formData.full_name || selectedUser.full_name,
      is_active: formData.is_active ?? selectedUser.is_active,
      hierarchy_level:
        formData.role_hierarchy !== undefined
          ? hierarchyLevelMap[formData.role_hierarchy]
          : selectedUser.hierarchy_level,
    };

    updateMutation.mutate({ userId: selectedUser.user_id, data: updateData });
  };

  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<number | null>(null);

  const handleDeleteUser = (userId: number) => {
    setDeleteConfirmUserId(userId);
  };

  const confirmDelete = () => {
    if (deleteConfirmUserId) {
      deleteMutation.mutate(deleteConfirmUserId);
      setDeleteConfirmUserId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold">Users</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">You do not have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading users...</p>}
          {error && <p className="text-destructive">Error loading users: {error.message}</p>}

          {data && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.user_id}</TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded px-2 py-1 text-xs ${
                            user.is_admin
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {user.is_admin ? 'Admin' : user.hierarchy_level}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded px-2 py-1 text-xs ${
                            user.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.user_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {data.users.length} of {data.total} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {page} of {data.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.total_pages}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role_hierarchy">Role</Label>
                  <select
                    id="role_hierarchy"
                    value={formData.role_hierarchy}
                    onChange={(e) =>
                      setFormData({ ...formData, role_hierarchy: parseInt(e.target.value) })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value={0}>Global Admin</option>
                    <option value={1}>Order</option>
                    <option value={2}>Region</option>
                    <option value={3}>Organization</option>
                  </select>
                </div>
                {createMutation.error && (
                  <div className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {createMutation.error.message}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Dialog */}
      {isEditDialogOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit User: {selectedUser.username}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_full_name">Full Name</Label>
                  <Input
                    id="edit_full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_role_hierarchy">Role</Label>
                  <select
                    id="edit_role_hierarchy"
                    value={formData.role_hierarchy}
                    onChange={(e) =>
                      setFormData({ ...formData, role_hierarchy: parseInt(e.target.value) })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value={0}>Global Admin</option>
                    <option value={1}>Order</option>
                    <option value={2}>Region</option>
                    <option value={3}>Organization</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="edit_is_active" className="cursor-pointer font-normal">
                    Active
                  </Label>
                </div>
                {updateMutation.error && (
                  <div className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {updateMutation.error.message}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedUser(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Updating...' : 'Update User'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirm Delete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Are you sure you want to delete user{' '}
                <strong>
                  {data?.users.find((u) => u.user_id === deleteConfirmUserId)?.username}
                </strong>
                ? This will deactivate their account.
              </p>
              {deleteMutation.error && (
                <div className="mb-4 rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {deleteMutation.error.message}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmUserId(null)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
