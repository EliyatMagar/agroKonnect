// features/farmer/orders/FarmerOrders.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOrders, useOrderFilters, useOrderManagement } from '../../../features/order/hooks/useOrders';
import type { OrderResponse, OrderStatus } from '../../../features/order/types/orderTypes';
import { 
  orderStatuses, 
  formatCurrency, 
  getOrderStatusColor, 
  getNextAllowedStatuses,
  getStatusDisplayInfo,
  getPaymentStatusDisplayInfo,
  requiresAction
} from '../../../features/order/utils/orderUtils';

export const FarmerOrders: React.FC = () => {
  const { 
    getFarmerOrders, 
    updateOrderStatus, 
    loading, 
    error 
  } = useOrders();
  
  const { 
    filters, 
    updateFilter, 
    updatePage, 
    updatePageSize, 
    clearFilters,
    getFilterCount 
  } = useOrderFilters();
  
  const { 
    selectedOrder, 
    selectOrder, 
    clearSelection,
    actionLoading 
  } = useOrderManagement();

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [useMockData, setUseMockData] = useState(false);

  const currentPage = filters.page || 1;
  const currentPageSize = filters.page_size || 10;
  const currentStatusFilter = filters.status as OrderStatus | undefined;

  // Fetch farmer orders with filters
  const fetchOrders = useCallback(async () => {
    console.log('🔄 FarmerOrders: Fetching orders with filters:', { 
      page: currentPage, 
      pageSize: currentPageSize, 
      status: currentStatusFilter 
    });
    
    const response = await getFarmerOrders(
      currentPage, 
      currentPageSize, 
      { status: currentStatusFilter }
    );
    
    if (response) {
      console.log('✅ FarmerOrders: Orders fetched successfully:', response.orders.length, 'orders');
      setOrders(response.orders);
      setTotalOrders(response.total);
      setTotalPages(response.pages);
      setUseMockData(false);
    } else {
      console.log('🔄 FarmerOrders: Using mock data as fallback');
      setOrders([]);
      setTotalOrders(0);
      setTotalPages(0);
      setUseMockData(true);
    }
  }, [getFarmerOrders, currentPage, currentPageSize, currentStatusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle status filter change
  const handleStatusFilterChange = (status: OrderStatus | 'all') => {
    console.log('🎛️ FarmerOrders: Status filter changed to:', status);
    
    if (status === 'all') {
      updateFilter('status', undefined);
    } else {
      updateFilter('status', status);
    }
    
    // Reset to page 1 when filter changes
    updatePage(1);
  };

  // Handle order status update
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus, notes?: string) => {
    const success = await updateOrderStatus(orderId, { 
      status: newStatus, 
      notes: notes || '' 
    });
    
    if (success) {
      await fetchOrders(); // Refresh orders
      if (selectedOrder?.id === orderId) {
        // Refresh selected order details
        const updatedOrder = orders.find(order => order.id === orderId);
        if (updatedOrder) {
          selectOrder({ ...updatedOrder, status: newStatus });
        }
      }
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    updatePage(newPage);
  };

  // Clear all filters
  const handleClearFilters = () => {
    clearFilters();
    updatePage(1);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage and track your customer orders</p>
          {useMockData && (
            <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-800 text-sm">
                  Using demo data. API endpoint not available.
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {totalOrders} total orders
          </span>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Filter
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleStatusFilterChange(e.target.value as OrderStatus | 'all')}
              className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              {orderStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Items per page
            </label>
            <select
              value={currentPageSize}
              onChange={(e) => updatePageSize(Number(e.target.value))}
              className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          {getFilterCount() > 0 && (
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Filters ({getFilterCount()})
              </button>
            </div>
          )}
        </div>

        {/* Active Filter Display */}
        {currentStatusFilter && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-sm text-gray-600">Active filter:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {getStatusDisplayInfo(currentStatusFilter).label}
            </span>
            <button
              onClick={() => handleStatusFilterChange('all')}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              × Clear
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Orders Grid */}
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onSelect={selectOrder}
                  onStatusUpdate={handleStatusUpdate}
                  actionLoading={actionLoading}
                />
              ))}
            </tbody>
          </table>

          {orders.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {getFilterCount() > 0 
                  ? "Try adjusting your filters to see more results." 
                  : "You haven't received any orders yet."}
              </p>
              {getFilterCount() > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 px-4 py-2 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center w-full">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={clearSelection}
          onStatusUpdate={handleStatusUpdate}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

// Order Row Component
interface OrderRowProps {
  order: OrderResponse;
  onSelect: (order: OrderResponse) => void;
  onStatusUpdate: (orderId: string, status: OrderStatus, notes?: string) => void;
  actionLoading: boolean;
}

const OrderRow: React.FC<OrderRowProps> = ({ 
  order, 
  onSelect, 
  onStatusUpdate,
  actionLoading 
}) => {
  const statusInfo = getStatusDisplayInfo(order.status);
  const paymentStatusInfo = getPaymentStatusDisplayInfo(order.payment_status);
  const needsAction = requiresAction(order, 'farmer');
  const nextStatuses = getNextAllowedStatuses(order.status, 'farmer');

  // Safe color class generation
  const getStatusColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      orange: 'bg-orange-100 text-orange-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      cyan: 'bg-cyan-100 text-cyan-800',
      teal: 'bg-teal-100 text-teal-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  const statusColorClass = getStatusColorClass(statusInfo.color);
  const paymentColorClass = getStatusColorClass(paymentStatusInfo.color);

  return (
    <tr 
      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
        needsAction ? 'bg-yellow-50 hover:bg-yellow-100' : ''
      }`}
      onClick={() => onSelect(order)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-sm font-medium">#</span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {order.order_number}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(order.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{order.buyer_name}</div>
        <div className="text-sm text-gray-500">{order.shipping_city}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatCurrency(order.total_amount)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColorClass}`}>
          {statusInfo.label}
        </span>
        {needsAction && (
          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Action Required
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentColorClass}`}>
          {paymentStatusInfo.label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-2">
          {nextStatuses.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                e.stopPropagation();
                if (e.target.value) {
                  onStatusUpdate(order.id, e.target.value as OrderStatus);
                }
              }}
              disabled={actionLoading}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Update Status</option>
              {nextStatuses.map((status) => {
                const nextStatusInfo = getStatusDisplayInfo(status);
                return (
                  <option key={status} value={status}>
                    Mark as {nextStatusInfo.label}
                  </option>
                );
              })}
            </select>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(order);
            }}
            className="text-green-600 hover:text-green-900 text-xs font-medium transition-colors"
          >
            View Details
          </button>
        </div>
      </td>
    </tr>
  );
};

// Order Details Modal Component
interface OrderDetailsModalProps {
  order: OrderResponse;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: OrderStatus, notes?: string) => void;
  actionLoading: boolean;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onStatusUpdate,
  actionLoading
}) => {
  const [statusNotes, setStatusNotes] = useState('');
  const nextStatuses = getNextAllowedStatuses(order.status, 'farmer');

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    onStatusUpdate(order.id, newStatus, statusNotes);
    setStatusNotes('');
  };

  // Safe color class generation
  const getStatusTextColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      orange: 'text-orange-600',
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      cyan: 'text-cyan-600',
      teal: 'text-teal-600',
      green: 'text-green-600',
      red: 'text-red-600',
      gray: 'text-gray-600'
    };
    return colorMap[color] || 'text-gray-600';
  };

  const getStatusButtonColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
      blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
      cyan: 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500',
      teal: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500',
      green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      gray: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
    };
    return colorMap[color] || 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500';
  };

  const statusTextColor = getStatusTextColor(getOrderStatusColor(order.status));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Order {order.order_number}
            </h2>
            <p className="text-sm text-gray-500">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Status & Actions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Current Status</h3>
                <p className={`text-lg font-semibold ${statusTextColor}`}>
                  {getStatusDisplayInfo(order.status).label}
                </p>
              </div>
              {nextStatuses.length > 0 && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add notes (optional)"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 w-48"
                  />
                  <div className="flex space-x-2">
                    {nextStatuses.map((status) => {
                      const statusInfo = getStatusDisplayInfo(status);
                      const buttonColorClass = getStatusButtonColor(statusInfo.color);
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(status)}
                          disabled={actionLoading}
                          className={`px-3 py-2 text-sm font-medium text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonColorClass} disabled:opacity-50 transition-colors`}
                        >
                          Mark as {statusInfo.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer & Shipping Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Customer Information</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900">{order.buyer_name}</p>
                <p className="text-sm text-gray-500">Customer</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-900">{order.shipping_address}</p>
                <p className="text-sm text-gray-500">
                  {order.shipping_city}, {order.shipping_state} {order.shipping_zip_code}
                </p>
                {order.shipping_notes && (
                  <p className="text-sm text-gray-500 mt-2">
                    <strong>Notes:</strong> {order.shipping_notes}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Order Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <span className="text-gray-400 text-xs">No image</span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.product_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.quality_grade} • {item.organic ? 'Organic' : 'Conventional'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="max-w-xs ml-auto">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(order.sub_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">{formatCurrency(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">{formatCurrency(order.tax_amount)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-green-600">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-900 font-medium">Total:</span>
                  <span className="text-gray-900 font-bold">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Information */}
          {order.tracking_number && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Tracking Information</h3>
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm text-gray-600">Tracking Number</p>
                  <p className="text-sm font-medium">{order.tracking_number}</p>
                </div>
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Track Package →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Estimated Delivery</h3>
              <p className="text-sm text-gray-600">
                {new Date(order.estimated_delivery).toLocaleDateString()}
              </p>
            </div>
            {order.actual_delivery && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Actual Delivery</h3>
                <p className="text-sm text-gray-600">
                  {new Date(order.actual_delivery).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerOrders;