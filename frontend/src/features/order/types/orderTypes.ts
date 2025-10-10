// types/orderTypes.ts
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export type PaymentMethod = 
  | 'bank_transfer'
  | 'credit_card'
  | 'digital_wallet'
  | 'upi'
  | 'cash_on_delivery';

// Core Order Interfaces
export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  farmer_id: string;
  vendor_id: string;
  transporter_id?: string;
  total_amount: number;
  sub_total: number;
  tax_amount: number;
  shipping_cost: number;
  discount_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_id?: string;
  paid_at?: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip_code: string;
  shipping_notes?: string;
  estimated_delivery: string;
  actual_delivery?: string;
  tracking_number?: string;
  tracking_url?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  order_items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  unit_price: number;
  quantity: number;
  unit: string;
  total_price: number;
  quality_grade: string;
  organic: boolean;
  harvest_date: string;
}

export interface OrderTracking {
  id: string;
  order_id: string;
  status: OrderStatus;
  location: string;
  description: string;
  notes: string;
  created_at: string;
}

// Request DTOs
export interface CreateOrderRequest {
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip_code: string;
  shipping_notes?: string;
  payment_method: PaymentMethod;
  items: OrderItemRequest[];
}

export interface OrderItemRequest {
  product_id: string;
  quantity: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
}

export interface AssignTransporterRequest {
  transporter_id: string;
  vehicle_id?: string;
  estimated_delivery: string;
}

export interface PaymentRequest {
  order_id: string;
  payment_method: PaymentMethod;
  payment_details: any;
}

export interface OrderFilterRequest {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  buyer_id?: string;
  farmer_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
  order_number?: string;
  search?: string;
}

export interface AdminOrderFilterRequest extends OrderFilterRequest {
  vendor_id?: string;
  transporter_id?: string;
  min_amount?: number;
  max_amount?: number;
  has_tracking?: boolean;
  is_delayed?: boolean;
}

// Response DTOs
export interface OrderResponse {
  id: string;
  order_number: string;
  buyer_id: string;
  buyer_name: string;
  farmer_id: string;
  farmer_name: string;
  transporter_id?: string;
  transporter_name?: string;
  vendor_name: string;
  vendor_id?: string;
  total_amount: number;
  sub_total: number;
  tax_amount: number;
  shipping_cost: number;
  discount_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  shipping_notes:string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip_code: string;
  estimated_delivery: string;
  actual_delivery?: string;
  tracking_number?: string;
  tracking_url?: string;
  order_items: OrderItemResponse[];
  tracking_history: TrackingResponse[];
  created_at: string;
  updated_at:string;
}

export interface OrderItemResponse {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  unit_price: number;
  quantity: number;
  unit: string;
  total_price: number;
  quality_grade: string;
  organic: boolean;
}

export interface TrackingResponse {
  status: OrderStatus;
  location: string;
  description: string;
  notes: string;
  timestamp: string;
}

export interface OrderSummaryResponse {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
}

export interface OrderListResponse {
  orders: OrderResponse[];
  total: number;
  page: number;
  pages: number;
  has_more: boolean;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Form Data Types
export interface OrderFormData {
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip_code: string;
  shipping_notes?: string;
  payment_method: PaymentMethod;
  items: OrderItemRequest[];
}

export interface CheckoutItem {
  product_id: string;
  product_name: string;
  product_image: string;
  unit_price: number;
  quantity: number;
  unit: string;
  available_stock: number;
}

// Additional utility types
export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_by_status: Record<OrderStatus, number>;
  orders_by_payment_status: Record<PaymentStatus, number>;
  recent_orders: OrderResponse[];
}

export interface OrderCreateResult {
  order: Order;
  payment_required: boolean;
  payment_url?: string;
}

export interface OrderCancellationResult {
  success: boolean;
  refund_amount?: number;
  message: string;
}