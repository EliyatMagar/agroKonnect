import React, { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authKeys, useProfile } from '../hooks/useAuth';
import { useMyFarmerProfile } from '../../../features/farmer/hooks/farmerHooks';
import { useMyBuyerProfile } from '../../../features/buyer/hooks/useBuyer';
import type { UserRole, UserResponse } from '../types/auth';

interface AuthContextType {
  user: UserResponse | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean;
  profileLoading: boolean;
  userRole: UserRole | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { 
    data: user, 
    isLoading: userLoading, 
    error,
    isError,
    refetch: refetchProfile
  } = useProfile();
  
  // ✅ FIX: Conditionally fetch profiles based on user role
  const { 
    data: farmerProfile, 
    isLoading: farmerProfileLoading 
  } = useMyFarmerProfile(user?.role === 'farmer'); // Only fetch if user is farmer
  
  const {
    data: buyerProfile, 
    isLoading: buyerProfileLoading
  } = useMyBuyerProfile(user?.role === 'buyer'); // Only fetch if user is buyer

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log('🚪 Logging out user...');
      
      // Clear tokens from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Clear all React Query cache
      queryClient.clear();
      
      // Reset auth state
      setIsAuthenticated(false);
      
      // Dispatch event for other components to handle
      window.dispatchEvent(new Event('auth-logout'));
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  }, [queryClient]);

  // Initialize authentication state on app start
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('access_token');
      console.log('🚀 App initialization - Token check:', {
        hasToken: !!token,
        tokenLength: token?.length
      });
      
      setIsAuthenticated(!!token);
      setIsInitializing(false);
    };

    initializeAuth();
  }, []);

  // Update authentication state when user data changes
  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    } else if (!userLoading && !isInitializing) {
      // Only set to false if we're done loading and no user was found
      const token = localStorage.getItem('access_token');
      setIsAuthenticated(!!token);
    }
  }, [user, userLoading, isInitializing]);

  // Handle token refresh and auto-reauthentication
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const token = localStorage.getItem('access_token');
        if (token && !user) {
          console.log('🔄 Page visible, refetching user profile...');
          refetchProfile();
        }
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        console.log('🔄 Access token changed in storage');
        const token = localStorage.getItem('access_token');
        setIsAuthenticated(!!token);
        
        if (token) {
          refetchProfile();
        } else {
          queryClient.removeQueries({ queryKey: authKeys.all });
        }
      }
    };

    const handleAuthLogout = () => {
      console.log('🔄 Auth logout event received');
      setIsAuthenticated(false);
      queryClient.removeQueries({ queryKey: authKeys.all });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-logout', handleAuthLogout);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, [queryClient, refetchProfile, user]);

  // Handle authentication errors more gracefully
  useEffect(() => {
    if (isError && error) {
      const errorMessage = (error as Error).message || '';
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Session expired')) {
        console.log('🔄 Clearing tokens due to authentication error');
        
        const shouldClearTokens = errorMessage.includes('unauthorized') || 
                                errorMessage.includes('401') || 
                                errorMessage.includes('Session expired');
        
        if (shouldClearTokens) {
          logout();
        }
      }
    }
  }, [error, isError, logout]);

  // Determine if user has profile based on their role
  const hasProfile = useMemo(() => {
    if (!user) return false;
    
    switch (user.role) {
      case 'farmer':
        return !!farmerProfile;
      case 'vendor':
        return false;
      case 'transporter':
        return false;
      case 'buyer':
        return !!buyerProfile;
      default:
        return false;
    }
  }, [user, farmerProfile, buyerProfile]);

  // Determine profile loading state based on role
  const profileLoading = useMemo(() => {
    if (!user) return false;
    
    switch (user.role) {
      case 'farmer':
        return farmerProfileLoading;
      case 'vendor':
        return false;
      case 'transporter':
        return false;
      case 'buyer':
        return buyerProfileLoading;
      default:
        return false;
    }
  }, [user, farmerProfileLoading, buyerProfileLoading]);

  // Debug logging
  useEffect(() => {
    console.log('AuthProvider State Update:', {
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
      userLoading,
      isInitializing,
      isAuthenticated,
      hasProfile,
      profileLoading,
      userRole: user?.role || null,
      hasToken: !!localStorage.getItem('access_token')
    });
  }, [user, userLoading, isInitializing, isAuthenticated, hasProfile, profileLoading]);

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing app...</p>
        </div>
      </div>
    );
  }

  // ✅ FIX: Convert undefined to null for context value
  const value: AuthContextType = {
    user: user || null, // Convert undefined to null
    isLoading: userLoading,
    isAuthenticated,
    hasProfile,
    profileLoading,
    userRole: user?.role || null,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};