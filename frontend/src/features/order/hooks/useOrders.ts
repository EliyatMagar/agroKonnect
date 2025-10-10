// hooks/useOrders.ts
import { useState, useCallback, useEffect } from 'react';
import type {
  Order,
  OrderResponse,
  OrderListResponse,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  AssignTransporterRequest,
  PaymentRequest,
  OrderSummaryResponse,
  TrackingResponse,
  OrderFilterRequest,
  AdminOrderFilterRequest,
  OrderStatus
  // Removed unused: PaymentStatus, PaymentMethod
} from '../types/orderTypes';
import { orderApi } from '../api/orderApi';

export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (data: CreateOrderRequest): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const order = await orderApi.createOrder(data);
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrder = useCallback(async (id: string): Promise<OrderResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const order = await orderApi.getOrder(id);
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderByNumber = useCallback(async (orderNumber: string): Promise<OrderResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const order = await orderApi.getOrderByNumber(orderNumber);
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyOrders = useCallback(async (page: number = 1, pageSize: number = 10): Promise<OrderListResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const orders = await orderApi.getMyOrders(page, pageSize);
      return orders;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (
    id: string, 
    data: UpdateOrderStatusRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await orderApi.updateOrderStatus(id, data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignTransporter = useCallback(async (
    id: string, 
    data: AssignTransporterRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await orderApi.assignTransporter(id, data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign transporter');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const processPayment = useCallback(async (
    id: string, 
    data: PaymentRequest
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await orderApi.processPayment(id, data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await orderApi.cancelOrder(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTrackingHistory = useCallback(async (id: string): Promise<TrackingResponse[]> => {
    setLoading(true);
    setError(null);
    try {
      const tracking = await orderApi.getTrackingHistory(id);
      return tracking;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracking history');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderSummary = useCallback(async (): Promise<OrderSummaryResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const summary = await orderApi.getOrderSummary();
      return summary;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order summary');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrdersWithFilters = useCallback(async (
    filters: OrderFilterRequest
  ): Promise<OrderListResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.getOrdersWithFilters(filters);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAdminOrders = useCallback(async (
    filters: AdminOrderFilterRequest
  ): Promise<OrderListResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.getAdminOrders(filters);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin orders');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced filter method with debouncing
  const searchOrders = useCallback(async (
    searchTerm: string,
    filters: Partial<OrderFilterRequest> = {}
  ): Promise<OrderListResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const searchFilters: OrderFilterRequest = {
        ...filters,
        search: searchTerm,
        page: 1,
        page_size: 20
      };
      const response = await orderApi.getOrdersWithFilters(searchFilters);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search orders');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Role-specific order fetchers
  const getBuyerOrders = useCallback(async (page: number = 1, pageSize: number = 10): Promise<OrderListResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const orders = await orderApi.getBuyerOrders(page, pageSize);
      return orders;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch buyer orders');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

// hooks/useOrders.ts - UPDATE THE GETFARMERORDERS METHOD
const getFarmerOrders = useCallback(async (
  page: number = 1, 
  pageSize: number = 10,
  filters?: { status?: string }
): Promise<OrderListResponse | null> => {
  setLoading(true);
  setError(null);
  try {
    console.log(`🔄 Hook: Fetching farmer orders - Page: ${page}, PageSize: ${pageSize}, Filters:`, filters);
    const orders = await orderApi.getFarmerOrders(page, pageSize, filters);
    console.log('✅ Hook: Farmer orders received:', orders.orders.length, 'orders');
    return orders;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch farmer orders';
    console.error('❌ Hook: Error in getFarmerOrders:', errorMessage);
    setError(errorMessage);
    return null;
  } finally {
    setLoading(false);
  }
}, []);

  const getTransporterOrders = useCallback(async (page: number = 1, pageSize: number = 10): Promise<OrderListResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const orders = await orderApi.getTransporterOrders(page, pageSize);
      return orders;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transporter orders');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk operations
  const bulkUpdateOrderStatus = useCallback(async (
    orderIds: string[],
    status: OrderStatus,
    notes?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // This would typically call a bulk update endpoint
      const promises = orderIds.map(orderId => 
        orderApi.updateOrderStatus(orderId, { status, notes: notes || '' })
      );
      await Promise.all(promises);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk update orders');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    
    // Order CRUD
    createOrder,
    getOrder,
    getOrderByNumber,
    getMyOrders,
    updateOrderStatus,
    cancelOrder,
    
    // Order Management
    assignTransporter,
    processPayment,
    
    // Tracking & Analytics
    getTrackingHistory,
    getOrderSummary,
    
    // Filtering & Search
    getOrdersWithFilters,
    getAdminOrders,
    searchOrders,
    
    // Role-specific
    getBuyerOrders,
    getFarmerOrders,
    getTransporterOrders,
    
    // Bulk operations
    bulkUpdateOrderStatus,
    
    // Utilities
    clearError,
  };
};

// Hook for order management state
export const useOrderManagement = () => {
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectOrder = useCallback((order: OrderResponse) => {
    setSelectedOrder(order);
    setActionError(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedOrder(null);
    setActionError(null);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setActionLoading(loading);
  }, []);

  const setError = useCallback((error: string | null) => {
    setActionError(error);
  }, []);

  const clearError = useCallback(() => {
    setActionError(null);
  }, []);

  return {
    selectedOrder,
    actionLoading,
    actionError,
    selectOrder,
    clearSelection,
    setLoading,
    setError,
    clearError,
  };
};

// Hook for order filters
export const useOrderFilters = () => {
  const [filters, setFilters] = useState<OrderFilterRequest>({
    page: 1,
    page_size: 10,
  });

  const updateFilter = useCallback((key: keyof OrderFilterRequest, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset to first page when filters change
      ...(key !== 'page' && { page: 1 }),
    }));
  }, []);

  const updatePage = useCallback((page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  }, []);

  const updatePageSize = useCallback((pageSize: number) => {
    setFilters(prev => ({
      ...prev,
      page_size: pageSize,
      page: 1, // Reset to first page when page size changes
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      page_size: 10,
    });
  }, []);

  const getFilterCount = useCallback((): number => {
    let count = 0;
    const { page, page_size, ...filterFields } = filters;
    
    Object.values(filterFields).forEach(value => {
      if (value !== undefined && value !== null && value !== '') {
        count++;
      }
    });
    
    return count;
  }, [filters]);

  return {
    filters,
    updateFilter,
    updatePage,
    updatePageSize,
    clearFilters,
    getFilterCount,
  };
};

// Hook for admin order filters
export const useAdminOrderFilters = () => {
  const [filters, setFilters] = useState<AdminOrderFilterRequest>({
    page: 1,
    page_size: 10,
  });

  const updateFilter = useCallback((key: keyof AdminOrderFilterRequest, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset to first page when filters change
      ...(key !== 'page' && { page: 1 }),
    }));
  }, []);

  const updatePage = useCallback((page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  }, []);

  const updatePageSize = useCallback((pageSize: number) => {
    setFilters(prev => ({
      ...prev,
      page_size: pageSize,
      page: 1, // Reset to first page when page size changes
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      page_size: 10,
    });
  }, []);

  const getFilterCount = useCallback((): number => {
    let count = 0;
    const { page, page_size, ...filterFields } = filters;
    
    Object.values(filterFields).forEach(value => {
      if (value !== undefined && value !== null && value !== '') {
        count++;
      }
    });
    
    return count;
  }, [filters]);

  return {
    filters,
    updateFilter,
    updatePage,
    updatePageSize,
    clearFilters,
    getFilterCount,
  };
};

// Hook for checkout process
export const useCheckout = () => {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'review'>('cart');

  const { createOrder, processPayment } = useOrders();

  const proceedToCheckout = useCallback(async (orderData: CreateOrderRequest) => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    
    try {
      const order = await createOrder(orderData);
      if (order) {
        setCheckoutStep('payment');
        return order;
      }
      return null;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Failed to create order');
      return null;
    } finally {
      setCheckoutLoading(false);
    }
  }, [createOrder]);

  const completePayment = useCallback(async (orderId: string, paymentData: PaymentRequest) => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    
    try {
      const success = await processPayment(orderId, paymentData);
      if (success) {
        setCheckoutStep('review');
      }
      return success;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Failed to process payment');
      return false;
    } finally {
      setCheckoutLoading(false);
    }
  }, [processPayment]);

  const setStep = useCallback((step: 'cart' | 'shipping' | 'payment' | 'review') => {
    setCheckoutStep(step);
  }, []);

  const resetCheckout = useCallback(() => {
    setCheckoutStep('cart');
    setCheckoutError(null);
    setCheckoutLoading(false);
  }, []);

  return {
    checkoutLoading,
    checkoutError,
    checkoutStep,
    proceedToCheckout,
    completePayment,
    setStep,
    resetCheckout,
  };
};

// Hook for real-time order tracking
export const useOrderTracking = (orderId?: string) => {
  const [trackingData, setTrackingData] = useState<TrackingResponse[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const { getTrackingHistory } = useOrders();

  // Auto-start tracking when orderId is provided and changes
  useEffect(() => {
    if (orderId) {
      initializeTracking(orderId);
    } else {
      stopTracking();
      setTrackingData([]);
    }

    // Cleanup on unmount
    return () => {
      stopTracking();
    };
  }, [orderId]);

  const startTracking = useCallback(async (id: string) => {
    if (isPolling) return;
    
    setIsPolling(true);
    const fetchTracking = async () => {
      try {
        const tracking = await getTrackingHistory(id);
        setTrackingData(tracking);
        
        // Check if order is still in transit
        const latestStatus = tracking[tracking.length - 1]?.status;
        if (latestStatus && ['shipped', 'in_transit'].includes(latestStatus)) {
          // Continue polling every 30 seconds for active shipments
          setTimeout(() => fetchTracking(), 30000);
        } else {
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Failed to fetch tracking data:', error);
        setIsPolling(false);
      }
    };
    
    fetchTracking();
  }, [getTrackingHistory, isPolling]);

  const stopTracking = useCallback(() => {
    setIsPolling(false);
  }, []);

  const refreshTracking = useCallback(async (id: string) => {
    try {
      const tracking = await getTrackingHistory(id);
      setTrackingData(tracking);
      return tracking;
    } catch (error) {
      console.error('Failed to refresh tracking data:', error);
      return [];
    }
  }, [getTrackingHistory]);

  // Auto-start tracking when orderId is provided
  const initializeTracking = useCallback((id: string) => {
    refreshTracking(id);
    if (!isPolling) {
      startTracking(id);
    }
  }, [refreshTracking, startTracking, isPolling]);

  return {
    trackingData,
    isPolling,
    startTracking,
    stopTracking,
    refreshTracking,
    initializeTracking,
  };
};

export default useOrders;