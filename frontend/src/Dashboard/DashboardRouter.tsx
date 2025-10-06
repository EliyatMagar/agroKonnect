import React from 'react';
import { useAuthContext } from '../features/auth/context/AuthProvider';
import { FarmerDashboard } from './farmer/FarmerDashboard';
import { VendorDashboard } from './vendor/VendorDashboard';
import { TransporterDashboard } from './transporter/TransporterDashboard';
import { BuyerDashboard } from './buyer/BuyerDashboard';
import { ProfileRouter } from '../Profile/ProfileRouter';

export const DashboardRouter: React.FC = () => {
  const { user, hasProfile, profileLoading } = useAuthContext();

  if (!user || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have a profile, redirect to profile creation
  if (!hasProfile) {
    return <ProfileRouter />;
  }

  // User has profile, show appropriate dashboard
  switch (user.role) {
    case 'farmer':
      return <FarmerDashboard />;
    case 'vendor':
      return <VendorDashboard />;
    case 'transporter':
      return <TransporterDashboard />;
    case 'buyer':
      return <BuyerDashboard />;
    case 'admin':
      return <div>Admin Dashboard - Coming Soon</div>;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unknown User Role</h2>
            <p className="text-gray-600">Please contact support.</p>
          </div>
        </div>
      );
  }
};