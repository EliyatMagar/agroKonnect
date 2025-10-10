// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuthContext } from "./features/auth/context/AuthProvider";
import { ProtectedRoute } from './ProtectedRoute';
import LoginPage from './features/auth/pages/LoginPage';
import SignUpPage from './features/auth/pages/SignUpPage';
import { ForgotPasswordForm } from './features/auth/ui/ForgotPasswordForm';

import { DashboardRouter } from './Dashboard/DashboardRouter';

// Import dashboard components
import { FarmerDashboard } from './Dashboard/farmer/FarmerDashboard';
import { BuyerDashboard } from './Dashboard/buyer/BuyerDashboard';
import { VendorDashboard } from './Dashboard/vendor/VendorDashboard';
import { TransporterDashboard } from './Dashboard/transporter/TransporterDashboard';

import { CreateFarmerProfile } from './Profile/farmer/CreateFarmerProfile';

const queryClient = new QueryClient();

// Home component that redirects based on auth status
const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuthContext();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If authenticated, show the appropriate dashboard
  return <DashboardRouter />;
};

// Individual dashboard pages for direct navigation
const FarmerDashboardPage: React.FC = () => {
  const { user } = useAuthContext();
  
  if (user?.role !== 'farmer') {
    return <Navigate to="/" />;
  }
  
  return <FarmerDashboard />;
};

const BuyerDashboardPage: React.FC = () => {
  const { user } = useAuthContext();
  
  if (user?.role !== 'buyer') {
    return <Navigate to="/" />;
  }
  
  return <BuyerDashboard />;
};

const VendorDashboardPage: React.FC = () => {
  const { user } = useAuthContext();
  
  if (user?.role !== 'vendor') {
    return <Navigate to="/" />;
  }
  
  return <VendorDashboard />;
};

const TransporterDashboardPage: React.FC = () => {
  const { user } = useAuthContext();
  
  if (user?.role !== 'transporter') {
    return <Navigate to="/" />;
  }
  
  return <TransporterDashboard />;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />

            {/* Profile Creation Routes */}
            <Route 
              path="/farmer/create-profile"
              element={
                <ProtectedRoute requiredRole="farmer">
                  <CreateFarmerProfile />
                </ProtectedRoute>
              }
            />
            
            {/* Add placeholder routes for other roles - you can implement these later */}
            {/* <Route 
              path="/vendor/create-profile"
              element={
                <ProtectedRoute requiredRole="vendor">
                  <div>Vendor Profile Creation - Coming Soon</div>
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/transporter/create-profile"
              element={
                <ProtectedRoute requiredRole="transporter">
                  <div>Transporter Profile Creation - Coming Soon</div>
                </ProtectedRoute>
              }
            />
            
          */}

             <Route 
              path="/buyer/create-profile"
              element={
                <ProtectedRoute requiredRole="buyer">
                  <div>Buyer Profile Creation - Coming Soon</div>
                </ProtectedRoute>
              }
            />

            {/* Main App Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            
            {/* Farmer Dashboard Routes */}
            <Route
              path="/farmer/*"
              element={
                <ProtectedRoute requiredRole="farmer">
                  <FarmerDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* ✅ FIXED: Buyer Dashboard Routes with /* */}
            <Route
              path="/buyer/*"
              element={
                <ProtectedRoute requiredRole="buyer">
                  <BuyerDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Other Dashboard Routes */}
            <Route
              path="/transporter/*"
              element={
                <ProtectedRoute requiredRole="transporter">
                  <TransporterDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/*"
              element={
                <ProtectedRoute requiredRole="vendor">
                  <VendorDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;