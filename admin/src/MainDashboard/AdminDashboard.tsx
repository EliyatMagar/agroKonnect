// components/AdminDashboard.tsx
import React, { useState } from 'react';
import { useUserStats } from '../auth/hooks/useUserStats';
import { useUserManagement } from '../auth/hooks/useUserManagement';
import UserStatsCards from '../auth/dashboard/UserStatsCards';
import UserManagementTable from '../auth/dashboard/UserManagementTable'
import UserFilters from '../auth/dashboard/UserFilters';

const AdminDashboard: React.FC = () => {
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useUserStats();
  const {
    users,
    loading: usersLoading,
    error: usersError,
    pagination,
    filters,
    updateFilters,
    changePage,
    updateUser,
    deleteUser,
    toggleUserStatus
  } = useUserManagement();

  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');

  const handleFilterChange = (newFilters: { role?: string; search?: string }) => {
    updateFilters(newFilters);
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    const result = await toggleUserStatus(userId, currentStatus);
    if (result.success) {
      refetchStats(); // Refresh stats when user status changes
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users and view platform statistics</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
            </nav>
          </div>
        </div>

        {/* Error Display */}
        {(statsError || usersError) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {statsError || usersError}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === 'overview' && (
          <div>
            <UserStatsCards 
              stats={stats} 
              loading={statsLoading} 
              error={statsError} // Added error prop
            />
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <UserFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              loading={usersLoading}
            />
            <UserManagementTable
              users={users}
              loading={usersLoading}
              pagination={pagination}
              onPageChange={changePage}
              onUpdateUser={updateUser}
              onDeleteUser={deleteUser}
              onToggleStatus={handleStatusToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;