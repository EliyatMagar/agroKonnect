import { 
  UserResponse, 
  UserStats, 
  UpdateUserRequest,
  PaginatedResponse 
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class AdminAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // User management endpoints
  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<PaginatedResponse<UserResponse>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.role) searchParams.append('role', params.role);
    if (params.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/admin/users${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async getUserById(id: string): Promise<UserResponse> {
    return this.request(`/admin/users/${id}`);
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<{ message: string }> {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async activateUser(id: string): Promise<{ message: string }> {
    return this.request(`/admin/users/${id}/activate`, {
      method: 'POST',
    });
  }

  async deactivateUser(id: string): Promise<{ message: string }> {
    return this.request(`/admin/users/${id}/deactivate`, {
      method: 'POST',
    });
  }

  async getUserStats(): Promise<UserStats> {
    return this.request('/admin/stats/users');
  }

  async impersonateUser(id: string): Promise<{
    access_token: string;
    expires_at: string;
    user: UserResponse;
    impersonated: boolean;
    message: string;
  }> {
    return this.request(`/admin/users/${id}/impersonate`, {
      method: 'POST',
    });
  }
}

export const adminAPI = new AdminAPI();