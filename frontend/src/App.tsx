import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuthContext } from "./features/auth/context/AuthProvider"
import { ProtectedRoute } from './ProtectedRoute'
import LoginPage from './features/auth/pages/LoginPage'
import SignUpPage from './features/auth/pages/SignUpPage'
import {ForgotPasswordForm} from './features/auth/ui/ForgotPasswordForm';

import {DashboardRouter} from './Dashboard/DashboardRouter'

//Import dashboard components

import {FarmerDashboard} from './Dashboard/farmer/FarmerDashboard';
import {BuyerDashboard} from './Dashboard/buyer/BuyerDashboard';
import {VendorDashboard} from './Dashboard/vendor/VendorDashboard';
import {TransporterDashboard} from './Dashboard/transporter/TransporterDashboard';


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

//Individual dashboard pages for direct navigation
const FarmerDashboardPage: React.FC = () => {
  const { user } = useAuthContext();
  
  if (user?.role !== 'farmer') {
    return <Navigate to="/" />;
  }
  
  return <FarmerDashboard />;
};

//Buyer
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/dashboard"
              element={
                <ProtectedRoute>
                  <FarmerDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/buyer/dashboard"
              element={
                <ProtectedRoute>
                  <BuyerDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transporter/dashboard"
              element={
                <ProtectedRoute>
                  <TransporterDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/dashboard"
              element={
                <ProtectedRoute>
                  <VendorDashboardPage />
                </ProtectedRoute>
              }
            />

          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;