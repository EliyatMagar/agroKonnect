import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import type { 
  LoginRequest, 
  RegisterRequest, 
  VerifyEmailRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest, 
  ChangePasswordRequest,
  AuthResponse,
  UserResponse 
} from '../types/auth';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

// Hook to get current user profile
export const useProfile = () => {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async (): Promise<UserResponse> => {
      try {
        console.log('🔄 Fetching user profile...');
        
        // DEBUG: Check tokens before making request
        const token = localStorage.getItem('access_token');
        console.log(`profile fetch token check`, {
          hasToken: !!token,
          tokenLength:token?.length
        });
        authApi.debugTokens();
        
        const user = await authApi.getCurrentUser();
        console.log('✅ User profile fetched successfully:', user);
        
        // Store user data in localStorage as backup
        localStorage.setItem('user_data', JSON.stringify(user));
        
        return user;
      } catch (error) {
        console.error('❌ Failed to fetch user profile:', error);
        
        // Try to use stored user data as fallback
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
          console.log('🔄 Using stored user data as fallback');
          try {
            return JSON.parse(storedUser);
          } catch (parseError) {
            console.error('❌ Failed to parse stored user data:', parseError);
          }
        }
        
        // Clear tokens on authentication errors
        if (error instanceof Error && (
          error.message.includes('401') || 
          error.message.includes('Session expired') ||
          error.message.includes('Please login again') ||
          error.message.includes('Authentication required') ||
          error.message.includes('unauthorized')
        )) {
          console.log('🔄 Clearing tokens due to auth error');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
        }
        throw error;
      }
    },
    enabled: !!localStorage.getItem('access_token'),
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('401') || 
          error?.message?.includes('Session expired') ||
          error?.message?.includes('Please login again') ||
          error?.message?.includes('Authentication required') ||
          error?.message?.includes('unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for login
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data: AuthResponse) => {
      console.log('✅ Login successful, storing tokens...');
      
      // DEBUG: Check what we're receiving
      console.log('🔧 Login response data:', {
        user: data.user,
        access_token_length: data.access_token?.length,
        refresh_token_length: data.refresh_token?.length,
        expires_at: data.expires_at
      });
      
      // Store tokens securely
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        console.log('🔧 Access token stored in localStorage');
      } else {
        console.error('❌ No access_token received!');
      }
      
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
        console.log('🔧 Refresh token stored in localStorage');
      }
      
      // Store user data in localStorage as backup
      if (data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.user));
        queryClient.setQueryData(authKeys.user(), data.user);
        console.log('🔧 User data cached and stored:', data.user);
      }
      
      // Verify tokens were stored
      setTimeout(() => {
        authApi.debugTokens();
      }, 100);
    },
    onError: (error: Error) => {
      console.error('❌ Login error:', error);
      // Clear any potentially corrupted tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      queryClient.removeQueries({ queryKey: authKeys.user() });
    },
  });
};

// Hook for registration
export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
  });
};

// Hook for email verification
export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => authApi.verifyEmail(data),
  });
};

// Hook for password reset
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
  });
};

// Hook for reset password
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
  });
};

// Hook for change password
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
  });
};

// Test authentication hook
export const useTestAuth = () => {
  return useQuery({
    queryKey: ['auth', 'test'],
    queryFn: () => authApi.testAuth(),
    enabled: false, // Manual trigger only
  });
};

// Main auth hook
export const useAuth = () => {
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const testAuthQuery = useTestAuth();

  // Logout function
  const logout = () => {
    console.log('🔄 Logging out...');
    authApi.logout();
    queryClient.removeQueries({ queryKey: authKeys.all });
  };

  // Test authentication function
  const testAuth = () => {
    return testAuthQuery.refetch();
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return authApi.isAuthenticated();
  };

  // Get current user
  const getCurrentUser = (): UserResponse | undefined => {
    return queryClient.getQueryData(authKeys.user());
  };

  // Debug tokens
  const debugTokens = () => {
    authApi.debugTokens();
  };

  return {
    // Mutations
    login: loginMutation,
    register: registerMutation,
    verifyEmail: useVerifyEmail(),
    forgotPassword: useForgotPassword(),
    resetPassword: useResetPassword(),
    changePassword: useChangePassword(),
    
    // Functions
    logout,
    isAuthenticated,
    getCurrentUser,
    testAuth,
    debugTokens,
    
    // States
    isLoading: loginMutation.isPending || registerMutation.isPending,
    user: getCurrentUser(),
  };
};