import api from './api';
import type { UserResponse, UsersResponse, UserStats, UpdateUserData } from '../types/user';

class AdminService {
  private handleError(error: any): never {
    if (error.response?.status === 403) {
      throw new Error('Permission denied: You do not have admin access');
    }
    throw error;
  }

  async getUsers(
    page: number = 1, 
    limit: number = 10, 
    filters: { role?: string; search?: string } = {}
  ): Promise<UsersResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (filters.role) params.append('role', filters.role);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get<UsersResponse>(`/admin/users?${params}`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getUserById(userId: string): Promise<UserResponse> {
    try {
      const response = await api.get<UserResponse>(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateUser(userId: string, userData: UpdateUserData): Promise<{ message: string }> {
    try {
      const response = await api.put<{ message: string }>(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ message: string }>(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async activateUser(userId: string): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>(`/admin/users/${userId}/activate`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deactivateUser(userId: string): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>(`/admin/users/${userId}/deactivate`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get<UserStats>('/admin/stats/users');
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async impersonateUser(userId: string): Promise<{ 
    access_token: string; 
    expires_at: string;
    user: UserResponse;
    impersonated: boolean;
    message: string;
  }> {
    try {
      const response = await api.post(`/admin/users/${userId}/impersonate`);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export default new AdminService();