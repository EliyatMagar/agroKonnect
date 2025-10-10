// hooks/useCurrentFarmer.ts
import { useState, useEffect } from 'react';
import { useAuthContext } from '../../../features/auth/context/AuthProvider';

export const useCurrentFarmer = () => {
  const { user } = useAuthContext();
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFarmerId = async () => {
      if (!user) {
        setFarmerId(null);
        setLoading(false);
        return;
      }

      try {
        // Try to get farmer ID from user profile or farmer API
        const farmerProfile = await getFarmerProfile();
        setFarmerId(farmerProfile?.id || null);
      } catch (error) {
        console.error('Failed to get farmer ID:', error);
        setFarmerId(null);
      } finally {
        setLoading(false);
      }
    };

    getFarmerId();
  }, [user]);

  return { farmerId, loading };
};

// Mock function - replace with actual API call to get farmer profile
const getFarmerProfile = async (): Promise<{ id: string } | null> => {
  try {
    // This should call your farmer profile API
    // For now, return mock data that matches your mock orders
    return { id: 'current-farmer-id' };
  } catch (error) {
    console.error('Failed to fetch farmer profile:', error);
    return null;
  }
};