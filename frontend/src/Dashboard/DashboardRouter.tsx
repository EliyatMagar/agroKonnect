import React from 'react';
import { useAuthContext } from '../features/auth/context/AuthProvider';
import { FarmerDashboard } from './farmer/FarmerDashboard';
import { VendorDashboard } from './vendor/VendorDashboard';
import { TransporterDashboard } from './transporter/TransporterDashboard';
import { BuyerDashboard } from './buyer/BuyerDashboard';

export const DashboardRouter: React.FC = () => {
  const { user } = useAuthContext();

  if (!user) {
    return <div>Loading...</div>;
  }

  switch (user.role) {
    case 'farmer':
      return <FarmerDashboard />;
    case 'vendor':
      return <VendorDashboard />;
    case 'transporter':
      return <TransporterDashboard />;
    case 'buyer':
      return <BuyerDashboard />;
    default:
      return <div>Unknown user role</div>;
  }
};