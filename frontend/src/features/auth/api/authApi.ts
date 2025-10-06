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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class AuthApiService {

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const token = localStorage.getItem('access_token');
      
      // DEBUG: Check token before making request
      console.log('🔧 Token check for request:', {
        endpoint,
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
      });
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      console.log(`🔧 Making ${config.method || 'GET'} request to: ${url}`);

      const response = await fetch(url, config);
      console.log(`📡 Response status: ${response.status} for ${url}`);
      
      const responseText = await response.text();
      console.log('📨 Raw response:', responseText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        
        console.error('❌ API request failed:', {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          errorData
        });
        
        throw new Error(
          errorData.message || 
          errorData.error || 
          `Request failed with status ${response.status}`
        );
      }

      // Handle empty responses
      if (!responseText) {
        return {} as T;
      }
      
      // Parse the response - BE MORE FLEXIBLE
      try {
        const parsedResponse = JSON.parse(responseText);
        
        // Check if it's your API response format
        if (parsedResponse.success !== undefined) {
          // This is your API format: {success, message, data}
          if (!parsedResponse.success) {
            throw new Error(parsedResponse.message || 'API request failed');
          }
          console.log('✅ Request successful:', parsedResponse.message);
          return parsedResponse.data;
        } else {
          // This might be a direct response (like login returns {user, access_token, refresh_token})
          console.log('✅ Request successful (direct response)');
          return parsedResponse;
        }
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error(`💥 Request failed for ${endpoint}:`, error);
      
      if (error instanceof Error) {
        if (error.message.includes('Session expired') || error.message.includes('401')) {
          this.handleLogout();
        }
        throw error;
      } else {
        throw new Error(`Network error: ${String(error)}`);
      }
    }
  }

  private handleLogout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    window.dispatchEvent(new Event('auth-logout'));
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<{ message: string; user: UserResponse }> {
    return this.request<{ message: string; user: UserResponse }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      console.log('🔄 Refreshing token...');
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      
      console.log('🔄 Refresh token response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Refresh token failed:', errorText);
        throw new Error(`Refresh failed: ${response.status}`);
      }
      
      const responseText = await response.text();
      const apiResponse: ApiResponse<AuthResponse> = JSON.parse(responseText);
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'Token refresh failed');
      }
      
      console.log('✅ Token refresh successful');
      return apiResponse.data;
    } catch (error) {
      console.error('💥 Refresh token failed completely:', error);
      this.handleLogout();
      throw error;
    }
  }

  // Protected endpoints
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<UserResponse> {
    try {
      console.log('🔄 Getting current user from /api/profile...');
      const response = await this.request<any>('/profile');
      
      // Handle the new response format with debug info
      if (response.user) {
        console.log('✅ User profile fetched successfully:', response.user);
        return response.user;
      } else if (response.id) {
        // Direct user object
        console.log('✅ User profile fetched successfully (direct object)');
        return response;
      } else {
        console.error('❌ Unexpected response format:', response);
        throw new Error('Unexpected response format from server');
      }
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      
      // Fallback: Try to get user data from farmer profile
      try {
        console.log('🔄 Trying fallback: farmer profile...');
        const farmerProfile = await this.request<any>('/farmers/me/profile');
        
        if (farmerProfile && farmerProfile.user_id) {
          console.log('✅ Using farmer profile as fallback');
          return {
            id: farmerProfile.user_id,
            email: farmerProfile.email || 'user@example.com',
            phone: farmerProfile.alternate_phone || '',
            role: 'farmer',
            is_verified: farmerProfile.is_verified || false,
            is_active: true,
            created_at: farmerProfile.created_at || new Date().toISOString(),
            updated_at: farmerProfile.updated_at || new Date().toISOString(),
            last_login_at: new Date().toISOString()
          } as UserResponse;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
      
      throw error;
    }
  }

  // Test endpoint
  async testAuth(): Promise<any> {
    return this.request<any>('/test-auth');
  }

  // Utility methods
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  logout(): void {
    this.handleLogout();
  }

  async testConnection(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      console.log('🔧 Health check:', data);
      return data;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  // Debug method to check stored tokens
  debugTokens(): void {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userData = localStorage.getItem('user_data');
    
    console.log('🔧 Token Debug:', {
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length,
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length,
      hasUserData: !!userData,
      userData: userData ? JSON.parse(userData) : null
    });
  }
}

export const authApi = new AuthApiService();