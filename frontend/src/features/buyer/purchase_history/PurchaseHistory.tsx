// features/buyer/pages/PurchaseHistory.tsx
import React, { useState, useEffect } from 'react';
import { useOrders } from '../../order/hooks/useOrders';
import type { OrderResponse, OrderStatus, PaymentStatus } from '../../order/types/orderTypes';
import { 
  orderStatuses, 
  formatOrderNumber, 
  formatCurrency, 
  formatDate 
} from '../../order/utils/orderUtils';

export const PurchaseHistory: React.FC = () => {
  const { 
    getBuyerOrders, 
    getOrder,
    loading, 
    error 
  } = useOrders();
  
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter, paymentFilter, dateFilter]);

  const loadOrders = async () => {
    const response = await getBuyerOrders(currentPage, 20);
    if (response) {
      setOrders(response.orders);
      setTotalPages(response.pages);
    }
  };

  const handleViewOrder = async (orderId: string) => {
    const order = await getOrder(orderId);
    if (order) {
      setSelectedOrder(order);
      setShowOrderModal(true);
    }
  };

  const handleStatusFilter = (status: OrderStatus | 'all') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePaymentFilter = (status: PaymentStatus | 'all') => {
    setPaymentFilter(status);
    setCurrentPage(1);
  };

  const handleDateFilter = (range: string) => {
    setDateFilter(range);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Simulate export functionality
      await new Promise(resolve => setTimeout(resolve, 2000));
      const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchase-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
    const matchesSearch = searchTerm === '' || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.farmer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case '7days':
          matchesDate = diffDays <= 7;
          break;
        case '30days':
          matchesDate = diffDays <= 30;
          break;
        case '90days':
          matchesDate = diffDays <= 90;
          break;
        case 'year':
          matchesDate = diffDays <= 365;
          break;
      }
    }
    
    return matchesStatus && matchesPayment && matchesSearch && matchesDate;
  });

  const getTotalSpent = () => {
    return filteredOrders.reduce((total, order) => total + order.total_amount, 0);
  };

  const getCompletedOrders = () => {
    return filteredOrders.filter(order => order.status === 'delivered').length;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading purchase history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading purchase history</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase History</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track and manage all your purchase orders and transactions
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exportLoading || filteredOrders.length === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {exportLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">📦</span>
              </div>
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
              <dd className="text-2xl font-semibold text-gray-900">{filteredOrders.length}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Completed Orders</dt>
              <dd className="text-2xl font-semibold text-gray-900">{getCompletedOrders()}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xl">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Spent</dt>
              <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(getTotalSpent())}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Orders
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by order number or farmer..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value as OrderStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              {orderStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => handlePaymentFilter(e.target.value as PaymentStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => handleDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No purchases found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || dateFilter !== 'all'
                ? "No orders match your current filters."
                : "You haven't made any purchases yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <PurchaseHistoryCard 
                key={order.id}
                order={order}
                onViewOrder={handleViewOrder}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </div>
  );
};

// Purchase History Card Component
interface PurchaseHistoryCardProps {
  order: OrderResponse;
  onViewOrder: (orderId: string) => void;
}

const PurchaseHistoryCard: React.FC<PurchaseHistoryCardProps> = ({ order, onViewOrder }) => {
  const statusInfo = orderStatuses.find(s => s.value === order.status);
  
  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">📦</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {formatOrderNumber(order.order_number)}
                </h3>
                <div className="flex space-x-2">
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusInfo?.color}-100 text-${statusInfo?.color}-800`}
                  >
                    {statusInfo?.label}
                  </span>
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : order.payment_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Ordered: {formatDate(order.created_at)}</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                  </svg>
                  <span>From: {order.farmer_name}</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Items Preview */}
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {order.order_items.slice(0, 3).map((item, index) => (
                    <span 
                      key={item.id}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                    >
                      {item.product_name} × {item.quantity}
                    </span>
                  ))}
                  {order.order_items.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
                      +{order.order_items.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onViewOrder(order.id)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Order Modal Component (Simplified for Purchase History)
interface OrderModalProps {
  order: OrderResponse;
  onClose: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ order, onClose }) => {
  const statusInfo = orderStatuses.find(s => s.value === order.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {formatOrderNumber(order.order_number)}
              </h2>
              <div className="flex items-center space-x-4 mt-2">
                <span 
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${statusInfo?.color}-100 text-${statusInfo?.color}-800`}
                >
                  {statusInfo?.label}
                </span>
                <span 
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    order.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800'
                      : order.payment_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  Payment: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </span>
              </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Details */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="text-gray-900">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span className="text-gray-900">{order.order_items.length} products</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">{formatCurrency(order.sub_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="text-gray-900">{formatCurrency(order.shipping_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-900">{formatCurrency(order.tax_amount)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="text-green-600">-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-3">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Farmer Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Farmer Details</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold">
                        {order.farmer_name?.charAt(0) || 'F'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{order.farmer_name}</h4>
                    {order.farmer_email && (
                      <p className="text-sm text-gray-600">{order.farmer_email}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xl">🌱</span>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.product_name}</h4>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Quantity:</span> {item.quantity} {item.unit}
                          </div>
                          <div>
                            <span className="font-medium">Price:</span> {formatCurrency(item.unit_price)}
                          </div>
                          <div>
                            <span className="font-medium">Quality:</span> 
                            <span className="ml-1 capitalize">{item.quality_grade}</span>
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> 
                            <span className={`ml-1 ${item.organic ? 'text-green-600' : 'text-gray-600'}`}>
                              {item.organic ? 'Organic' : 'Conventional'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(item.total_price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistory;