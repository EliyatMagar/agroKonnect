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

// Auth hook
export const useAuth = () => {
  const queryClient = useQueryClient();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data: AuthResponse) => {
      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      
      // Set user data in cache
      queryClient.setQueryData(authKeys.user(), data.user);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
  });

  // Verify email mutation
  const verifyEmailMutation = useMutation({
    mutationFn: (data: VerifyEmailRequest) => authApi.verifyEmail(data),
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
  });

  // Get user profile query
  const profileQuery = useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authApi.getProfile(),
    enabled: !!localStorage.getItem('access_token'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Logout function
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    queryClient.removeQueries({ queryKey: authKeys.all });
    queryClient.clear();
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem('access_token');
  };

  // Get current user
  const getCurrentUser = (): UserResponse | undefined => {
    return queryClient.getQueryData(authKeys.user());
  };

  return {
    // Mutations
    login: loginMutation,
    register: registerMutation,
    verifyEmail: verifyEmailMutation,
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
    changePassword: changePasswordMutation,
    
    // Queries
    profile: profileQuery,
    
    // Functions
    logout,
    isAuthenticated,
    getCurrentUser,
    
    // States
    isLoading: loginMutation.isPending || registerMutation.isPending,
    user: getCurrentUser(),
  };
};

// Individual hook for profile
export const useProfile = () => {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authApi.getProfile(),
    enabled: !!localStorage.getItem('access_token'),
  });
};

// Hook for login
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data: AuthResponse) => {
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      queryClient.setQueryData(authKeys.user(), data.user);
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