import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile, authKeys } from '../hooks/useAuth';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useProfile();
  
  const isAuthenticated = !!localStorage.getItem('access_token');

  useEffect(() => {
    // If we have a token but profile query failed (e.g., token expired), clear auth
    if (isAuthenticated && error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      queryClient.removeQueries({ queryKey: authKeys.all });
    }
  }, [error, isAuthenticated, queryClient]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
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