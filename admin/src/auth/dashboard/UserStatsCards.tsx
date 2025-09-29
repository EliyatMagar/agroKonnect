// auth/dashboard/UserStatsCards.tsx - ENHANCED DEBUGGING
import React from 'react';
import type { UserStats } from '../types/user';

interface UserStatsCardsProps {
  stats: UserStats | null;
  loading: boolean;
  error?: string | null;
}

const UserStatsCards: React.FC<UserStatsCardsProps> = ({ stats, loading, error }) => {
  console.log('🎯 UserStatsCards rendering with:', { stats, loading, error });

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Failed to load statistics
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  // Show empty state when no stats are available
  if (!stats) {
    console.log('⚠️ No stats available for rendering');
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              No statistics available
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Unable to load user statistics. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering stats with data:', stats);

  // Safe data access with defaults
  const safeStats = {
    totalUsers: stats?.totalUsers ?? 0,
    activeUsers: stats?.activeUsers ?? 0,
    verifiedUsers: stats?.verifiedUsers ?? 0,
    newUsersToday: stats?.newUsersToday ?? 0,
    usersByRole: stats?.usersByRole ?? {
      admin: 0,
      farmer: 0,
      vendor: 0,
      transporter: 0,
      buyer: 0
    }
  };

  const cards = [
    {
      title: 'Total Users',
      value: safeStats.totalUsers,
      color: 'blue' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      title: 'Active Users',
      value: safeStats.activeUsers,
      color: 'green' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Verified Users',
      value: safeStats.verifiedUsers,
      color: 'purple' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: 'New Today',
      value: safeStats.newUsersToday,
      color: 'orange' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const getColorClasses = (color: 'blue' | 'green' | 'purple' | 'orange') => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500'
    };
    return colors[color];
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-full ${getColorClasses(card.color)} text-white`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Users by Role Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(safeStats.usersByRole).map(([role, count]) => (
            <div key={role} className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors duration-200">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {count.toLocaleString()}
              </div>
              <div className="text-sm font-medium text-gray-600 capitalize">
                {role}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserStatsCards;