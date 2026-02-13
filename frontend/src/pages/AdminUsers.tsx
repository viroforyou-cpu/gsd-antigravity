/**
 * AdminUsers - User management page for admin dashboard.
 *
 * Phase 24: Admin Dashboard
 */

import { useEffect, useState } from 'react';
import { useAdminStore } from '../stores/adminStore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Loading } from '../components/common/Loading';
import { Modal } from '../components/common/Modal';
import type { UserAdminView, UserAdminUpdate } from '../types/admin';

// User Row Component
function UserRow({
    user,
    onEdit,
    onDeactivate,
    onActivate,
    onViewActivity,
}: {
    user: UserAdminView;
    onEdit: (user: UserAdminView) => void;
    onDeactivate: (userId: string) => void;
    onActivate: (userId: string) => void;
    onViewActivity: (user: UserAdminView) => void;
}) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleDateString();
    };

    const formatTimeAgo = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <tr className="border-b hover:bg-gray-50">
            <td className="px-4 py-3">
                <div>
                    <p className="font-medium">{user.display_name || '—'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
            </td>
            <td className="px-4 py-3">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : user.role === 'guest'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                    {user.role}
                </span>
            </td>
            <td className="px-4 py-3">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${user.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">
                {formatDate(user.created_at)}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">
                {formatTimeAgo(user.last_activity)}
            </td>
            <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                    <span>{user.total_correct}/{user.total_questions_answered}</span>
                    {user.total_questions_answered > 0 && (
                        <span className="text-xs text-gray-400">
                            ({((user.total_correct / user.total_questions_answered) * 100).toFixed(0)}%)
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onViewActivity(user)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        View
                    </button>
                    <button
                        onClick={() => onEdit(user)}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                        Edit
                    </button>
                    {user.is_active ? (
                        <button
                            onClick={() => onDeactivate(user.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                        >
                            Deactivate
                        </button>
                    ) : (
                        <button
                            onClick={() => onActivate(user.id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                        >
                            Activate
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

// Edit User Modal
function EditUserModal({
    user,
    isOpen,
    onClose,
    onSave,
}: {
    user: UserAdminView | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (userId: string, data: UserAdminUpdate) => void;
}) {
    const [role, setRole] = useState(user?.role || 'user');
    const [displayName, setDisplayName] = useState(user?.display_name || '');

    useEffect(() => {
        if (user) {
            setRole(user.role);
            setDisplayName(user.display_name || '');
        }
    }, [user]);

    const handleSave = () => {
        if (!user) return;
        onSave(user.id, {
            role: role !== user.role ? role : undefined,
            display_name: displayName !== user.display_name ? displayName : undefined,
        });
        onClose();
    };

    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="text"
                        value={user.email}
                        disabled
                        className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter display name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                    </label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="guest">Guest</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

// User Activity Modal
function UserActivityModal({
    user,
    isOpen,
    onClose,
}: {
    user: UserAdminView | null;
    isOpen: boolean;
    onClose: () => void;
}) {
    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Activity: ${user.email}`}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-500">Sessions</p>
                        <p className="text-xl font-bold">{user.total_sessions}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-500">Questions</p>
                        <p className="text-xl font-bold">{user.total_questions_answered}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-500">Correct</p>
                        <p className="text-xl font-bold">{user.total_correct}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-500">Accuracy</p>
                        <p className="text-xl font-bold">
                            {user.total_questions_answered > 0
                                ? ((user.total_correct / user.total_questions_answered) * 100).toFixed(1)
                                : 0}%
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Account Details</h4>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">User ID</dt>
                            <dd className="font-mono text-xs">{user.id}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Created</dt>
                            <dd>{new Date(user.created_at).toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Last Activity</dt>
                            <dd>{user.last_activity ? new Date(user.last_activity).toLocaleString() : 'Never'}</dd>
                        </div>
                    </dl>
                </div>

                <div className="flex justify-end pt-4">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

// Main AdminUsers Component
export default function AdminUsers() {
    const {
        users,
        usersLoading,
        usersError,
        fetchUsers,
        updateUser,
        deactivateUser,
        activateUser,
    } = useAdminStore();

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [editingUser, setEditingUser] = useState<UserAdminView | null>(null);
    const [viewingUser, setViewingUser] = useState<UserAdminView | null>(null);

    useEffect(() => {
        fetchUsers({
            page,
            page_size: 20,
            search: search || undefined,
            role: roleFilter || undefined,
            is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        });
    }, [fetchUsers, page, search, roleFilter, statusFilter]);

    const handleEdit = (user: UserAdminView) => {
        setEditingUser(user);
    };

    const handleDeactivate = async (userId: string) => {
        if (confirm('Are you sure you want to deactivate this user?')) {
            try {
                await deactivateUser(userId);
            } catch (error) {
                alert('Failed to deactivate user');
            }
        }
    };

    const handleActivate = async (userId: string) => {
        try {
            await activateUser(userId);
        } catch (error) {
            alert('Failed to activate user');
        }
    };

    const handleSaveEdit = async (userId: string, data: UserAdminUpdate) => {
        try {
            await updateUser(userId, data);
        } catch (error) {
            alert('Failed to update user');
        }
    };

    const handleViewActivity = (user: UserAdminView) => {
        setViewingUser(user);
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">
                        Manage user accounts and permissions
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Search by email or name..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="guest">Guest</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </Card>

            {/* Error */}
            {usersError && (
                <Card className="p-4 bg-red-50 text-red-700 border-red-200">
                    {usersError}
                </Card>
            )}

            {/* Users Table */}
            <Card className="overflow-hidden">
                {usersLoading && !users ? (
                    <div className="flex justify-center py-8">
                        <Loading />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                        User
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                        Role
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                        Joined
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                        Last Active
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                        Progress
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users?.users.map((user) => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        onEdit={handleEdit}
                                        onDeactivate={handleDeactivate}
                                        onActivate={handleActivate}
                                        onViewActivity={handleViewActivity}
                                    />
                                ))}
                                {users?.users.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {users && users.total_pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                        <p className="text-sm text-gray-500">
                            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, users.total)} of {users.total} users
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(users.total_pages, p + 1))}
                                disabled={page === users.total_pages}
                                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Edit Modal */}
            <EditUserModal
                user={editingUser}
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                onSave={handleSaveEdit}
            />

            {/* Activity Modal */}
            <UserActivityModal
                user={viewingUser}
                isOpen={!!viewingUser}
                onClose={() => setViewingUser(null)}
            />
        </div>
    );
}
