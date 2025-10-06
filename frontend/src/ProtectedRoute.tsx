import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from './features/auth/context/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, userRole } = useAuthContext();
  const location = useLocation();

  console.log('🔒 Protected Route Check:', {
    isAuthenticated,
    isLoading,
    userRole,
    requiredRole,
    currentPath: location.pathname
  });

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('🔒 Redirecting to login - not authenticated');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if required
  if (requiredRole && userRole !== requiredRole) {
    console.log('🔒 Redirecting to home - insufficient permissions', {
      userRole,
      requiredRole
    });
    
    // You might want to redirect to a "not authorized" page instead
    return <Navigate to="/" replace />;
  }

  console.log('🔒 Access granted to protected route');
  return <>{children}</>;
};