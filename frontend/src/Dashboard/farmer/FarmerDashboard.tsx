// Dashboard/farmer/FarmerDashboard.tsx - NEW FILE
import React from 'react';
import { useMyFarmerProfile } from '../../features/farmer/hooks/farmerHooks';
import { FarmerProfile } from '../../features/farmer/pages/FarmerProfile';

export const FarmerDashboard: React.FC = () => {
  const { data: farmerProfile, isLoading } = useMyFarmerProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading farmer dashboard...</p>
        </div>
      </div>
    );
  }

  if (!farmerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Farmer Profile Found</h2>
          <p className="text-gray-600">Please create your farmer profile first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Farmer Dashboard</h1>
          <FarmerProfile farmer={farmerProfile} />
        </div>
      </div>
    </div>
  );
};