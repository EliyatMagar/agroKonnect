// Enhanced ProtectedRoute with role-based access
import React from 'react';
import { useAuthContext } from './features/auth/context/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRole?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = <div>Loading...</div>,
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, user } = useAuthContext();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to access this page</div>;
  }

  // Check role if required
  if (requiredRole && user) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!requiredRoles.includes(user.role)) {
      return <div>You don't have permission to access this page</div>;
    }
  }

  return <>{children}</>;
};