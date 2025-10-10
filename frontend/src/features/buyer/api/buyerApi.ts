import type { 
  Buyer,
  BuyerResponse,
  BuyerStatsResponse,
  BuyerListResponse,
  CreateBuyerRequest,
  UpdateBuyerRequest,
  BuyerFilterRequest
} from '../types/buyerTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class BuyerApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('access_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🔧 Making buyer ${config.method || 'GET'} request to: ${url}`);
      
      const response = await fetch(url, config);
      console.log(`📡 Buyer API response status: ${response.status} for ${url}`);
      
      if (!response.ok) {
        // Handle specific status codes
        if (response.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new Event('auth-logout'));
          throw new Error('Authentication required');
        }
        
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        
        throw new Error(errorData.message || errorData.error || 'Something went wrong');
      }

      const responseText = await response.text();
      
      if (!responseText) {
        throw new Error('Empty response from server');
      }
      
      const apiResponse: ApiResponse<T> = JSON.parse(responseText);
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'API request failed');
      }
      
      console.log('✅ Buyer API request successful');
      return apiResponse.data;
    } catch (error) {
      console.error(`💥 Buyer API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Buyer endpoints
  async createBuyer(data: CreateBuyerRequest): Promise<Buyer> {
    return this.request<Buyer>('/buyers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyProfile(): Promise<BuyerResponse> {
    return this.request<BuyerResponse>('/buyers/me');
  }

  async getBuyerById(id: string): Promise<BuyerResponse> {
    return this.request<BuyerResponse>(`/buyers/${id}`);
  }

 // In your buyerApi.ts - add debug logging
async updateBuyer(id: string, data: UpdateBuyerRequest): Promise<BuyerResponse> {
  console.log('🔍 Update Buyer Request Data:', JSON.stringify(data, null, 2));
  console.log('🔍 Business License field:', data.business_license);
  
  return this.request<BuyerResponse>(`/buyers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

  async deleteBuyer(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/buyers/${id}`, {
      method: 'DELETE',
    });
  }

  async getAllBuyers(filters?: Partial<BuyerFilterRequest>): Promise<BuyerListResponse> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/buyers?${queryString}` : '/buyers';
    
    return this.request<BuyerListResponse>(url);
  }

  async getBuyerStats(id: string): Promise<BuyerStatsResponse> {
    return this.request<BuyerStatsResponse>(`/buyers/${id}/stats`);
  }

  async getMyBuyerStats(): Promise<BuyerStatsResponse> {
    const profile = await this.getMyProfile();
    return this.getBuyerStats(profile.id);
  }

  async verifyBuyer(buyerId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/buyers/${buyerId}/verify`, {
      method: 'PUT',
    });
  }

  async updatePremiumStatus(buyerId: string, premium: boolean): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/buyers/${buyerId}/premium`, {
      method: 'PUT',
      body: JSON.stringify({ premium }),
    });
  }
}

export const buyerApi = new BuyerApiService();