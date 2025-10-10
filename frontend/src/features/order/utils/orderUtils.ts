// utils/orderUtils.ts
import type { 
  OrderStatus, 
  PaymentStatus, 
  PaymentMethod,
  OrderResponse,
  TrackingResponse
} from '../types/orderTypes';

export const orderStatuses: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'orange' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'processing', label: 'Processing', color: 'purple' },
  { value: 'shipped', label: 'Shipped', color: 'cyan' },
  { value: 'in_transit', label: 'In Transit', color: 'teal' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'refunded', label: 'Refunded', color: 'gray' },
];

export const paymentStatuses: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'orange' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'failed', label: 'Failed', color: 'red' },
  { value: 'refunded', label: 'Refunded', color: 'gray' },
];

export const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'digital_wallet', label: 'Digital Wallet' },
  { value: 'upi', label: 'UPI' },
  { value: 'cash_on_delivery', label: 'Cash on Delivery' },
];

export const validateOrderForm = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.shipping_address?.trim()) errors.push('Shipping address is required');
  if (!data.shipping_city?.trim()) errors.push('Shipping city is required');
  if (!data.shipping_state?.trim()) errors.push('Shipping state is required');
  if (!data.payment_method) errors.push('Payment method is required');
  if (!data.items || data.items.length === 0) errors.push('At least one order item is required');

  return errors;
};

export const formatOrderNumber = (orderNumber: string): string => {
  return `#${orderNumber}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const calculateOrderTotals = (items: any[], shippingCost: number = 0, taxRate: number = 0.1) => {
  const subTotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const taxAmount = subTotal * taxRate;
  const totalAmount = subTotal + taxAmount + shippingCost;

  return {
    subTotal,
    taxAmount,
    shippingCost,
    totalAmount,
  };
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  const statusConfig = orderStatuses.find(s => s.value === status);
  return statusConfig?.color || 'gray';
};

// FIXED: This function is now used
export const getPaymentStatusColor = (status: PaymentStatus): string => {
  const statusConfig = paymentStatuses.find(s => s.value === status);
  return statusConfig?.color || 'gray';
};

export const canCancelOrder = (status: OrderStatus): boolean => {
  const cancellableStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing'];
  return cancellableStatuses.includes(status);
};

export const canUpdateStatus = (currentStatus: OrderStatus, newStatus: OrderStatus): boolean => {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['in_transit', 'cancelled'],
    in_transit: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
    refunded: [],
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

// FIXED: This function is now used
export const canUpdateStatusWithRole = (currentStatus: OrderStatus, newStatus: OrderStatus, userRole: string): boolean => {
  const baseAllowed = canUpdateStatus(currentStatus, newStatus);
  
  if (!baseAllowed) return false;

  // Add role-specific restrictions
  switch (userRole) {
    case 'buyer':
      // Buyers can only cancel orders in certain statuses
      return newStatus === 'cancelled' && canCancelOrder(currentStatus);
    
    case 'farmer':
      // Farmers can update status from confirmed to delivered
      return ['confirmed', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'].includes(newStatus);
    
    case 'transporter':
      // Transporters can only update shipping-related statuses
      return ['shipped', 'in_transit', 'delivered'].includes(newStatus);
    
    case 'admin':
      // Admins can do anything
      return true;
    
    default:
      return false;
  }
};

export const getTrackingProgress = (trackingHistory: TrackingResponse[]): number => {
  const statusWeights: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 20,
    processing: 40,
    shipped: 60,
    in_transit: 80,
    delivered: 100,
    cancelled: 0,
    refunded: 0,
  };

  const currentStatus = trackingHistory[trackingHistory.length - 1]?.status;
  return statusWeights[currentStatus] || 0;
};

export const getEstimatedDeliveryDate = (order: OrderResponse): string => {
  const estimatedDate = new Date(order.estimated_delivery);
  return estimatedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const isOrderDelayed = (order: OrderResponse): boolean => {
  if (order.status === 'delivered' || order.status === 'cancelled') {
    return false;
  }

  const estimatedDate = new Date(order.estimated_delivery);
  const today = new Date();
  
  return today > estimatedDate;
};

export const getNextAllowedStatuses = (currentStatus: OrderStatus, userRole?: string): OrderStatus[] => {
  const allTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['in_transit', 'cancelled'],
    in_transit: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
    refunded: [],
  };

  const allowedStatuses = allTransitions[currentStatus] || [];

  if (!userRole) return allowedStatuses;

  // Filter based on user role using the fixed function
  return allowedStatuses.filter(status => {
    return canUpdateStatusWithRole(currentStatus, status, userRole);
  });
};

export const getStatusDisplayInfo = (status: OrderStatus) => {
  const statusInfo = orderStatuses.find(s => s.value === status);
  return statusInfo || { value: status, label: status, color: 'gray' };
};

// FIXED: Add the missing function
export const getPaymentStatusDisplayInfo = (status: PaymentStatus) => {
  const statusInfo = paymentStatuses.find(s => s.value === status);
  return statusInfo || { value: status, label: status, color: 'gray' };
};

export const getDeliveryTimeframe = (order: OrderResponse): string => {
  const created = new Date(order.created_at);
  const estimated = new Date(order.estimated_delivery);
  const diffTime = Math.abs(estimated.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
};

export const requiresAction = (order: OrderResponse, userRole: string): boolean => {
  switch (userRole) {
    case 'buyer':
      return order.payment_status === 'pending' && order.status === 'pending';
    
    case 'farmer':
      return order.status === 'confirmed' || order.status === 'processing';
    
    case 'transporter':
      return order.status === 'shipped' && !order.transporter_id;
    
    default:
      return false;
  }
};