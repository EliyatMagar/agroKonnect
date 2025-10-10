// features/farmer/hooks/useFarmerOrders.ts
import { useState, useCallback, useEffect } from 'react';
import { useOrders } from '../../../features/order/hooks/useOrders';
import type { OrderResponse, OrderStatus } from '../../../features/order/types/orderTypes';

export const useFarmerOrders = () => {
  const { 
    getFarmerOrders, 
    loading, 
    error 
  } = useOrders();

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [currentFilters, setCurrentFilters] = useState<{ status?: OrderStatus }>({});
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });

  const fetchOrders = useCallback(async (
    page: number = 1, 
    pageSize: number = 10,
    filters: { status?: OrderStatus } = {}
  ) => {
    console.log('🔄 useFarmerOrders: Fetching orders with filters:', filters);
    
    // Store current filters
    setCurrentFilters(filters);
    
    const response = await getFarmerOrders(page, pageSize, filters);
    
    if (response) {
      console.log('✅ useFarmerOrders: Orders received:', response.orders.length, 'orders');
      setOrders(response.orders);
      calculateStats(response.orders);
    } else {
      console.log('❌ useFarmerOrders: No response received');
      setOrders([]);
      calculateStats([]);
    }
    return response;
  }, [getFarmerOrders]);

  const calculateStats = useCallback((ordersList: OrderResponse[]) => {
    console.log('📊 useFarmerOrders: Calculating stats for', ordersList.length, 'orders');
    
    const newStats = {
      total: ordersList.length,
      pending: ordersList.filter(order => order.status === 'pending').length,
      confirmed: ordersList.filter(order => order.status === 'confirmed').length,
      processing: ordersList.filter(order => order.status === 'processing').length,
      shipped: ordersList.filter(order => order.status === 'shipped').length,
      delivered: ordersList.filter(order => order.status === 'delivered').length,
      cancelled: ordersList.filter(order => order.status === 'cancelled').length
    };
    
    console.log('📊 useFarmerOrders: Calculated stats:', newStats);
    setStats(newStats);
  }, []);

  const applyStatusFilter = useCallback((status: OrderStatus | 'all') => {
    console.log('🎛️ useFarmerOrders: Applying status filter:', status);
    
    const filters: { status?: OrderStatus } = {};
    if (status !== 'all') {
      filters.status = status;
    }
    
    // Reset to page 1 when filter changes
    fetchOrders(1, 10, filters);
  }, [fetchOrders]);

  const getOrdersByStatus = useCallback((status: string) => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  const getUrgentOrders = useCallback(() => {
    return orders.filter(order => 
      ['pending', 'confirmed'].includes(order.status) && 
      order.payment_status === 'paid'
    );
  }, [orders]);

  // Initialize on component mount
  useEffect(() => {
    console.log('🎯 useFarmerOrders: Initializing...');
    fetchOrders(1, 10);
  }, [fetchOrders]);

  return {
    // State
    orders,
    stats,
    currentFilters,
    loading,
    error,
    
    // Actions
    fetchOrders,
    applyStatusFilter,
    getOrdersByStatus,
    getUrgentOrders,
    
    // Utilities
    hasUrgentOrders: getUrgentOrders().length > 0,
    urgentOrdersCount: getUrgentOrders().length,
    activeFilterCount: Object.keys(currentFilters).filter(key => currentFilters[key as keyof typeof currentFilters] !== undefined).length
  };
};