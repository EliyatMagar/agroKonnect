import type { 
  Farmer,
  FarmerResponse,
  FarmerStatsResponse,
  FarmerListResponse,
  CreateFarmerRequest,
  UpdateFarmerRequest,
  FarmerFilterRequest
} from '../types/farmerTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class FarmerApiService {
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
      console.log(`🔧 Making farmer ${config.method || 'GET'} request to: ${url}`);
      
      const response = await fetch(url, config);
      console.log(`📡 Farmer API response status: ${response.status} for ${url}`);
      
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
      
      console.log('✅ Farmer API request successful');
      return apiResponse.data;
    } catch (error) {
      console.error(`💥 Farmer API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Farmer endpoints
  async createFarmer(data: CreateFarmerRequest): Promise<Farmer> {
    return this.request<Farmer>('/farmers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyProfile(): Promise<FarmerResponse> {
    return this.request<FarmerResponse>('/farmers/me/profile');
  }

  async getFarmerById(id: string): Promise<FarmerResponse> {
    return this.request<FarmerResponse>(`/farmers/${id}`);
  }

  async updateFarmer(data: UpdateFarmerRequest): Promise<FarmerResponse> {
    return this.request<FarmerResponse>('/farmers/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFarmer(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/farmers/me', {
      method: 'DELETE',
    });
  }

  async getAllFarmers(filters?: Partial<FarmerFilterRequest>): Promise<FarmerListResponse> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/farmers?${queryString}` : '/farmers';
    
    return this.request<FarmerListResponse>(url);
  }

  async getFarmerStats(): Promise<FarmerStatsResponse> {
    return this.request<FarmerStatsResponse>('/farmers/me/stats');
  }

  async getNearbyFarmers(lat: number, lng: number, radius?: number): Promise<FarmerResponse[]> {
    const queryParams = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });

    if (radius) {
      queryParams.append('radius', radius.toString());
    }

    return this.request<FarmerResponse[]>(`/farmers/nearby?${queryParams.toString()}`);
  }

  async searchFarmers(query: string, page?: number, size?: number): Promise<FarmerListResponse> {
    const queryParams = new URLSearchParams({ q: query });
    
    if (page) queryParams.append('page', page.toString());
    if (size) queryParams.append('size', size.toString());

    return this.request<FarmerListResponse>(`/farmers/search?${queryParams.toString()}`);
  }

  async verifyFarmer(farmerId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/farmers/${farmerId}/verify`, {
      method: 'PUT',
    });
  }
}

export const farmerApi = new FarmerApiService();