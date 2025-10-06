import React from 'react';
import { useAuthContext } from '../features/auth/context/AuthProvider';
import { CreateFarmerProfile } from './farmer/CreateFarmerProfile';
import { CreateBuyerProfile } from './buyer/CreateBuyerProfile';
import { CreateTransporterProfile } from './transporter/CreateTransporterProfile';
import { CreateVendorProfile } from './vendor/CreateVendorProfile';

export const ProfileRouter: React.FC = () => {
  const { user } = useAuthContext();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  switch (user.role) {
    case 'farmer':
      return <CreateFarmerProfile />;
    case 'vendor':
      return <CreateVendorProfile />;
    case 'transporter':
      return <CreateTransporterProfile />;
    case 'buyer':
      return <CreateBuyerProfile />;
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