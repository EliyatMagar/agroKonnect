import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authKeys, useProfile } from '../hooks/useAuth';
import { useMyFarmerProfile } from '../../../features/farmer/hooks/farmerHooks';
import type { UserRole } from '../types/auth';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean;
  profileLoading: boolean;
  userRole: UserRole | null;
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
  
  const { data: farmerProfile, isLoading: farmerProfileLoading } = useMyFarmerProfile();

  // ✅ FIX: Initialize authentication state on app start
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

  // ✅ FIX: Update authentication state when user data changes
  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    } else if (!userLoading && !isInitializing) {
      // Only set to false if we're done loading and no user was found
      const token = localStorage.getItem('access_token');
      setIsAuthenticated(!!token);
    }
  }, [user, userLoading, isInitializing]);

  // ✅ FIX: Handle token refresh and auto-reauthentication
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

  // ✅ FIX: Handle authentication errors more gracefully
  useEffect(() => {
    if (isError && error) {
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Session expired')) {
        console.log('🔄 Clearing tokens due to authentication error');
        
        // Only clear tokens if we're sure it's an auth error
        const shouldClearTokens = errorMessage.includes('unauthorized') || 
                                errorMessage.includes('401') || 
                                errorMessage.includes('Session expired');
        
        if (shouldClearTokens) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setIsAuthenticated(false);
          queryClient.removeQueries({ queryKey: authKeys.all });
        }
      }
    }
  }, [error, isError, queryClient]);

  // Determine if user has profile based on their role
  const hasProfile = React.useMemo(() => {
    if (!user) return false;
    
    switch (user.role) {
      case 'farmer':
        return !!farmerProfile;
      case 'vendor':
        return false; // Implement when vendor profile is available
      case 'transporter':
        return false; // Implement when transporter profile is available
      case 'buyer':
        return false; // Implement when buyer profile is available
      default:
        return false;
    }
  }, [user, farmerProfile]);

  // Determine profile loading state based on role
  const profileLoading = React.useMemo(() => {
    if (!user) return false;
    
    switch (user.role) {
      case 'farmer':
        return farmerProfileLoading;
      case 'vendor':
        return false;
      case 'transporter':
        return false;
      case 'buyer':
        return false;
      default:
        return false;
    }
  }, [user, farmerProfileLoading]);

  // Debug logging
  useEffect(() => {
    console.log('AuthProvider State Update:', {
      user,
      userLoading,
      isInitializing,
      isAuthenticated,
      hasProfile,
      profileLoading,
      userRole: user?.role || null,
      hasToken: !!localStorage.getItem('access_token')
    });
  }, [user, userLoading, isInitializing, isAuthenticated, hasProfile, profileLoading]);

  // ✅ FIX: Show loading state during initialization
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

  const value = {
    user,
    isLoading: userLoading,
    isAuthenticated,
    hasProfile,
    profileLoading,
    userRole: user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};