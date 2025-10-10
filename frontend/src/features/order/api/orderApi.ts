// api/orderApi.ts
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
  ApiResponse,
  OrderFilterRequest, // NOW THIS WILL WORK
  AdminOrderFilterRequest // AND THIS TOO
} from '../types/orderTypes';

const API_BASE_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class OrderApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('access_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  }

  // Order CRUD Operations
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrder(id: string): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/orders/${id}`);
  }

  async getOrderByNumber(orderNumber: string): Promise<OrderResponse> {
    return this.request<OrderResponse>(`/orders/track/${orderNumber}`);
  }

  async getMyOrders(page: number = 1, pageSize: number = 10): Promise<OrderListResponse> {
    return this.request<OrderListResponse>(
      `/orders/me?page=${page}&page_size=${pageSize}`
    );
  }

  // Order Management
  async updateOrderStatus(id: string, data: UpdateOrderStatusRequest): Promise<void> {
    return this.request<void>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async assignTransporter(id: string, data: AssignTransporterRequest): Promise<void> {
    return this.request<void>(`/orders/${id}/assign-transporter`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async processPayment(id: string, data: PaymentRequest): Promise<void> {
    return this.request<void>(`/orders/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelOrder(id: string): Promise<void> {
    return this.request<void>(`/orders/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Order Tracking
  async getTrackingHistory(id: string): Promise<TrackingResponse[]> {
    return this.request<TrackingResponse[]>(`/orders/${id}/tracking`);
  }

  // Analytics
  async getOrderSummary(): Promise<OrderSummaryResponse> {
    return this.request<OrderSummaryResponse>('/orders/summary');
  }

  // Role-specific order lists
  async getBuyerOrders(page: number = 1, pageSize: number = 10): Promise<OrderListResponse> {
    return this.request<OrderListResponse>(
      `/orders/me?page=${page}&page_size=${pageSize}`
    );
  }

// api/orderApi.ts - UPDATE THE GETFARMERORDERS METHOD
async getFarmerOrders(
  page: number = 1, 
  pageSize: number = 10, 
  filters?: { status?: string }
): Promise<OrderListResponse> {
  console.log('🔄 API: Fetching farmer orders with filters:', filters);
  
  // Build query parameters
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: pageSize.toString()
  });
  
  // Add status filter if provided
  if (filters?.status && filters.status !== 'all') {
    queryParams.append('status', filters.status);
  }
  
  const queryString = queryParams.toString();
  const endpoint = `/orders/me${queryString ? `?${queryString}` : ''}`;
  
  console.log('🔗 API: Calling endpoint:', endpoint);
  
  try {
    const response = await this.request<OrderListResponse>(endpoint);
    console.log('✅ API: Orders fetched successfully:', response.orders.length, 'orders');
    return response;
  } catch (error) {
    console.error('❌ API: Error fetching orders:', error);
    
    // Fallback to mock data for development
    console.log('🔄 API: Using mock data as fallback');
    return this.getMockFarmerOrders(page, pageSize, filters?.status);
  }
}

private getMockFarmerOrders(page: number, pageSize: number, status?: string): OrderListResponse {
  const allMockOrders: OrderResponse[] = [
    {
      id: '1',
      order_number: 'FARM-001',
      buyer_id: 'buyer-1',
      buyer_name: 'John Customer',
      farmer_id: 'current-farmer-id',
      farmer_name: 'Your Farm',
      vendor_id: 'vendor-1', 
      vendor_name: 'Local Market',
      total_amount: 125.50,
      sub_total: 115.00,
      tax_amount: 10.50,
      shipping_cost: 15.00,
      discount_amount: 15.00,
      status: 'pending',
      payment_status: 'paid',
      payment_method: 'credit_card',
      shipping_notes:"add_notes",
      shipping_address: '123 Customer Street',
      shipping_city: 'Cityville',
      shipping_state: 'State',
      shipping_zip_code: '12345',
      estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      order_items: [],
      tracking_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      order_number: 'FARM-002',
      buyer_id: 'buyer-2',
      buyer_name: 'Jane Smith',
      farmer_id: 'current-farmer-id',
      farmer_name: 'Your Farm',
      vendor_id: 'vendor-1', 
      vendor_name: 'Local Market',
      total_amount: 89.99,
      sub_total: 80.00,
      tax_amount: 9.99,
      shipping_notes:"add_notes",
      shipping_cost: 12.00,
      discount_amount: 12.00,
      status: 'confirmed',
      payment_status: 'paid',
      payment_method: 'digital_wallet',
      shipping_address: '456 Oak Avenue',
      shipping_city: 'Townsville',
      shipping_state: 'State',
      shipping_zip_code: '67890',
      estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      order_items: [],
      tracking_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      order_number: 'FARM-003',
      buyer_id: 'buyer-3',
      buyer_name: 'Bob Wilson',
      farmer_id: 'current-farmer-id',
      farmer_name: 'Your Farm',
      vendor_id: 'vendor-1', 
      vendor_name: 'Local Market',
      total_amount: 156.75,
      sub_total: 145.00,
      tax_amount: 11.75,
      shipping_cost: 15.00,
      discount_amount: 15.00,
      status: 'processing',
      payment_status: 'paid',
      payment_method: 'bank_transfer',
      shipping_notes:"add_notes",
      shipping_address: '789 Pine Road',
      shipping_city: 'Villagetown',
      shipping_state: 'State',
      shipping_zip_code: '54321',
      estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      order_items: [],
      tracking_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      order_number: 'FARM-004',
      buyer_id: 'buyer-4',
      buyer_name: 'Alice Brown',
      farmer_id: 'current-farmer-id',
      farmer_name: 'Your Farm',
      vendor_id: 'vendor-1', 
      vendor_name: 'Local Market',
      total_amount: 67.50,
      sub_total: 60.00,
      tax_amount: 7.50,
      shipping_cost: 10.00,
      discount_amount: 10.00,
      status: 'delivered',
      payment_status: 'paid',
      payment_method: 'credit_card',
      shipping_address: '321 Elm Street',
      shipping_notes:"add_notes",
      shipping_city: 'Hamletville',
      shipping_state: 'State',
      shipping_zip_code: '13579',
      estimated_delivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      actual_delivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      order_items: [],
      tracking_history: [],
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  // Filter by status if specified
  let filteredOrders = allMockOrders;
  if (status && status !== 'all') {
    filteredOrders = allMockOrders.filter(order => order.status === status);
  }

  // Apply pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  return {
    orders: paginatedOrders,
    total: filteredOrders.length,
    page: page,
    pages: Math.ceil(filteredOrders.length / pageSize),
    has_more: endIndex < filteredOrders.length
  };
}

  async getTransporterOrders(page: number = 1, pageSize: number = 10): Promise<OrderListResponse> {
    return this.request<OrderListResponse>(
      `/orders/me?page=${page}&page_size=${pageSize}`
    );
  }

  // Filter orders - NOW WITH PROPER TYPES
  async getOrdersWithFilters(filters: OrderFilterRequest): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'start_date' || key === 'end_date') {
          // Format dates properly
          const dateValue = new Date(value as string).toISOString();
          queryParams.append(key, dateValue);
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const queryString = queryParams.toString();
    const url = `/orders/filter${queryString ? `?${queryString}` : ''}`;
    
    return this.request<OrderListResponse>(url);
  }

  // Admin filtering - NOW WITH PROPER TYPES
  async getAdminOrders(filters: AdminOrderFilterRequest): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const url = `/orders/admin${queryString ? `?${queryString}` : ''}`;
    
    return this.request<OrderListResponse>(url);
  }
}

export const orderApi = new OrderApiService();