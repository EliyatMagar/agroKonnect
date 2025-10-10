// features/farmer/components/OrderStats.tsx
import React from 'react';
import { useFarmerOrders } from './useFarmerOrders';
import { Link } from 'react-router-dom';

export const OrderStats: React.FC = () => {
  const { stats, loading, hasUrgentOrders, error, urgentOrdersCount } = useFarmerOrders();

  console.log('📊 OrderStats: Rendering with stats:', stats, 'loading:', loading, 'error:', error);

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Order Overview</h2>
          <div className="text-green-600 hover:text-green-700 text-sm font-medium">
            View all orders →
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow border animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Failed to load order statistics</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Order Overview</h2>
        <Link
          to="/farmer/orders"
          className="text-green-600 hover:text-green-700 text-sm font-medium"
        >
          View all orders →
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">📦</span>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-lg">⏳</span>
            </div>
          </div>
        </div>

        {/* Processing Orders */}
        <div className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-purple-600">{stats.processing}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-lg">🔄</span>
            </div>
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {/* Confirmed Orders */}
        <div className="bg-white p-3 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Confirmed</p>
              <p className="text-lg font-bold text-blue-600">{stats.confirmed}</p>
            </div>
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
              <span className="text-blue-500 text-sm">✓</span>
            </div>
          </div>
        </div>

        {/* Shipped Orders */}
        <div className="bg-white p-3 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Shipped</p>
              <p className="text-lg font-bold text-cyan-600">{stats.shipped}</p>
            </div>
            <div className="w-8 h-8 bg-cyan-50 rounded-full flex items-center justify-center">
              <span className="text-cyan-500 text-sm">🚚</span>
            </div>
          </div>
        </div>

        {/* Cancelled Orders */}
        <div className="bg-white p-3 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Cancelled</p>
              <p className="text-lg font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-sm">✕</span>
            </div>
          </div>
        </div>
      </div>

      {hasUrgentOrders && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Attention required ({urgentOrdersCount} urgent orders)
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                You have {urgentOrdersCount} order{urgentOrdersCount !== 1 ? 's' : ''} that need immediate processing.
              </p>
            </div>
            <div className="ml-auto">
              <Link
                to="/farmer/orders?status=pending"
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                View urgent orders
              </Link>
            </div>
          </div>
        </div>
      )}

      {stats.total === 0 && !loading && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                No orders yet
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                You haven't received any orders. They will appear here once customers start ordering your products.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};