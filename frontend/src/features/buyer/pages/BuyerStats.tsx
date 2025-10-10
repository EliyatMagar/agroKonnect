import React from 'react';
import { useBuyerStats } from '../hooks/useBuyer';
import { formatMonthlyVolume } from '../utils/buyerUtils';

interface BuyerStatsProps {
  buyerId: string;
}

export const BuyerStats: React.FC<BuyerStatsProps> = ({ buyerId }) => {
  const { data: stats, isLoading } = useBuyerStats(buyerId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">📦</span>
            </div>
          </div>
          <div className="ml-4">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
            <dd className="text-2xl font-semibold text-gray-900">{stats.total_orders}</dd>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600">✅</span>
            </div>
          </div>
          <div className="ml-4">
            <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
            <dd className="text-2xl font-semibold text-gray-900">{stats.completed_orders}</dd>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600">💰</span>
            </div>
          </div>
          <div className="ml-4">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Spent</dt>
            <dd className="text-2xl font-semibold text-gray-900">
              {formatMonthlyVolume(stats.total_spent)}
            </dd>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600">⭐</span>
            </div>
          </div>
          <div className="ml-4">
            <dt className="text-sm font-medium text-gray-500 truncate">Avg Rating</dt>
            <dd className="text-2xl font-semibold text-gray-900">{stats.average_rating}/5</dd>
          </div>
        </div>
      </div>
    </div>
  );
};