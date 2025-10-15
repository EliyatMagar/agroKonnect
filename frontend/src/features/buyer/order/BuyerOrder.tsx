// features/buyer/orders/BuyerOrders.tsx
import React, { useState, useEffect } from 'react';
import { useOrders } from '../../order/hooks/useOrders';
import type { OrderResponse, OrderStatus } from '../../order/types/orderTypes';
import { 
  orderStatuses, 
  formatOrderNumber, 
  formatCurrency, 
  getEstimatedDeliveryDate,
  canCancelOrder 
} from '../../order/utils/orderUtils';

export const BuyerOrders: React.FC = () => {
  const { 
    getBuyerOrders, 
    cancelOrder, 
    getOrder,
    loading, 
    error 
  } = useOrders();
  
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter]);

  const loadOrders = async () => {
    const response = await getBuyerOrders(currentPage, 10);
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

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      const success = await cancelOrder(orderId);
      if (success) {
        loadOrders(); // Refresh orders
        setShowOrderModal(false);
      }
    }
  };

  const handleStatusFilter = (status: OrderStatus | 'all') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading orders...</span>
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
            <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
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
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track and manage your purchase orders
        </p>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Orders
          </button>
          {orderStatuses.map((status) => (
            <button
              key={status.value}
              onClick={() => handleStatusFilter(status.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === status.value
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {statusFilter === 'all' 
                ? "You haven't placed any orders yet."
                : `No orders with status "${orderStatuses.find(s => s.value === statusFilter)?.label}"`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <OrderCard 
                key={order.id}
                order={order}
                onViewOrder={handleViewOrder}
                onCancelOrder={handleCancelOrder}
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
          onCancelOrder={handleCancelOrder}
        />
      )}
    </div>
  );
};

// Order Card Component
interface OrderCardProps {
  order: OrderResponse;
  onViewOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewOrder, onCancelOrder }) => {
  const statusInfo = orderStatuses.find(s => s.value === order.status);
  
  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">📦</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {formatOrderNumber(order.order_number)}
                </h3>
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusInfo?.color}-100 text-${statusInfo?.color}-800`}
                >
                  {statusInfo?.label}
                </span>
              </div>
              
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <span>Placed on {new Date(order.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{order.order_items.length} items</span>
                <span>•</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                Estimated delivery: {getEstimatedDeliveryDate(order)}
              </div>

              {/* Farmer Preview */}
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                  </svg>
                  From: {order.farmer_name || 'Local Farmer'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onViewOrder(order.id)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View Details
          </button>
          
          {canCancelOrder(order.status) && (
            <button
              onClick={() => onCancelOrder(order.id)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Order Modal Component
interface OrderModalProps {
  order: OrderResponse;
  onClose: () => void;
  onCancelOrder: (orderId: string) => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ order, onClose, onCancelOrder }) => {
  const statusInfo = orderStatuses.find(s => s.value === order.status);
  const paymentStatusInfo = orderStatuses.find(s => s.value === order.payment_status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
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
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${paymentStatusInfo?.color}-100 text-${paymentStatusInfo?.color}-800`}
                >
                  Payment: {paymentStatusInfo?.label}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Items & Farmer Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-2xl">🌱</span>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg">{item.product_name}</h4>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Quantity:</span> {item.quantity} {item.unit}
                          </div>
                          <div>
                            <span className="font-medium">Unit Price:</span> {formatCurrency(item.unit_price)}
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
                        <div className="font-bold text-gray-900 text-lg">
                          {formatCurrency(item.total_price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Farmer Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Farmer Details</h3>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xl font-semibold">
                          {order.farmer_name?.charAt(0) || 'F'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg">
                        {order.farmer_name || 'Farm Name'}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <span>Farmer ID: {order.farmer_id}</span>
                          </div>
                          
                          {order.farmer_email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{order.farmer_email}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {order.farmer_phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{order.farmer_phone}</span>
                            </div>
                          )}
                          
                          {order.farmer_address && (
                            <div className="flex items-start text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{order.farmer_address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Additional farmer information can go here */}
                      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center text-sm text-green-800">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>All products in this order are sourced directly from this farmer</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary & Shipping */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3">
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

              {/* Shipping Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="font-medium text-gray-900">{order.shipping_address}</p>
                    <p className="text-gray-600 mt-1">
                      {order.shipping_city}, {order.shipping_state} {order.shipping_zip_code}
                    </p>
                    {order.shipping_notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-100">
                        <p className="text-sm text-blue-800">
                          <strong>Delivery Notes:</strong> {order.shipping_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Estimated Delivery:</span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {getEstimatedDeliveryDate(order)}
                    </p>
                    
                    {order.tracking_number && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-100">
                        <p className="text-sm font-medium text-blue-800">Tracking Number</p>
                        <p className="text-sm text-blue-600 mt-1">{order.tracking_number}</p>
                        {order.tracking_url && (
                          <a 
                            href={order.tracking_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                          >
                            Track Package
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                <div className="bg-white rounded-lg p-4 border space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="text-gray-900 font-medium capitalize">
                      {order.payment_method.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      order.payment_status === 'paid' ? 'text-green-600' : 
                      order.payment_status === 'pending' ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {canCancelOrder(order.status) && (
                <div className="pt-4">
                  <button
                    onClick={() => onCancelOrder(order.id)}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerOrders;