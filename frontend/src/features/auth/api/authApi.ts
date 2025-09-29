import type { 
  AuthResponse, 
  UserResponse, 
  LoginRequest, 
  RegisterRequest, 
  VerifyEmailRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest, 
  ChangePasswordRequest 
} from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

class AuthApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.message || error.error || 'Something went wrong');
    }

    return response.json();
  }

  private async authRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('access_token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    return this.request<T>(endpoint, { ...options, headers });
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<{ message: string; user: UserResponse }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<{ message: string }> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  // Protected endpoints
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return this.authRequest('/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<UserResponse> {
    return this.authRequest('/profile');
  }
}

export const authApi = new AuthApiService();