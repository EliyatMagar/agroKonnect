// components/UserManagementTable.tsx - FIXED
import React, { useState } from 'react';
import type { UserResponse, Pagination, UpdateUserData } from '../types/user';

interface UserManagementTableProps {
  users: UserResponse[];
  loading: boolean;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onUpdateUser: (userId: string, userData: UpdateUserData) => Promise<{ success: boolean; error?: string }>;
  onDeleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  onToggleStatus: (userId: string, currentStatus: boolean) => Promise<{ success: boolean; error?: string }>;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users,
  loading,
  pagination,
  onPageChange,
  onUpdateUser,
  onDeleteUser,
  onToggleStatus
}) => {
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserData>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleEdit = (user: UserResponse) => {
    setEditingUser(user.id);
    setEditForm({
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive
    });
  };

  const handleSave = async (userId: string) => {
    setActionLoading(userId);
    const result = await onUpdateUser(userId, editForm);
    setActionLoading(null);
    if (result.success) {
      setEditingUser(null);
      setEditForm({});
    } else {
      alert(result.error);
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setActionLoading(userId);
      const result = await onDeleteUser(userId);
      setActionLoading(null);
      
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    const result = await onToggleStatus(userId, currentStatus);
    setActionLoading(null);
    
    if (!result.success) {
      alert(result.error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      farmer: 'bg-green-100 text-green-800',
      vendor: 'bg-blue-100 text-blue-800',
      transporter: 'bg-yellow-100 text-yellow-800',
      buyer: 'bg-purple-100 text-purple-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Safe pagination calculations
  const safePagination = {
    page: pagination?.page || 1,
    limit: pagination?.limit || 10,
    total: pagination?.total || 0,
    pages: pagination?.pages || 0
  };

  const startItem = (safePagination.page - 1) * safePagination.limit + 1;
  const endItem = Math.min(safePagination.page * safePagination.limit, safePagination.total);

  if (loading && users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verified
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUser === user.id ? (
                    <div className="space-y-2">
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Email"
                      />
                      <input
                        type="tel"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Phone"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUser === user.id ? (
                    <select
                      value={editForm.role || user.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="farmer">Farmer</option>
                      <option value="vendor">Vendor</option>
                      <option value="transporter">Transporter</option>
                      <option value="buyer">Buyer</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingUser === user.id ? (
                    <select
                      value={editForm.isActive !== undefined ? editForm.isActive.toString() : user.isActive.toString()}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.isVerified ? (
                    <span className="text-green-600 font-medium">Verified</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingUser === user.id ? (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleSave(user.id)}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === user.id ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleEdit(user)}
                        disabled={actionLoading !== null}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleStatusToggle(user.id, user.isActive)}
                        disabled={actionLoading === user.id}
                        className={`px-3 py-1 text-xs rounded ${
                          user.isActive 
                            ? 'bg-orange-600 text-white hover:bg-orange-700' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {actionLoading === user.id ? 'Updating...' : user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === user.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {users.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Pagination */}
      {safePagination.pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span>{' '}
              of <span className="font-medium">{safePagination.total}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(safePagination.page - 1)}
                disabled={safePagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(safePagination.page + 1)}
                disabled={safePagination.page === safePagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTable;