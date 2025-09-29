import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  VerifyEmailRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest, 
  ChangePasswordRequest, 
  UserResponse 
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class UserAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
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

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return this.request('/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async getProfile(): Promise<UserResponse> {
    return this.request('/profile');
  }

  // Role-based dashboard endpoints
  async getFarmerDashboard(): Promise<any> {
    return this.request('/farmer/dashboard');
  }

  async getVendorDashboard(): Promise<any> {
    return this.request('/vendor/dashboard');
  }

  async getTransporterDashboard(): Promise<any> {
    return this.request('/transporter/dashboard');
  }

  async getBuyerDashboard(): Promise<any> {
    return this.request('/buyer/dashboard');
  }
}

export const userAPI = new UserAPI();