// auth/hooks/useUserStats.ts - FIXED
import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import type { UserStats } from '../types/user';

interface UseUserStatsReturn {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Enhanced transformation with better debugging
const transformStatsResponse = (data: any): UserStats => {
  console.log('🔄 RAW Stats data for transformation:', data);
  
  // Handle both snake_case and camelCase
  const transformed = {
    totalUsers: data.total_users ?? data.totalUsers ?? 0,
    activeUsers: data.active_users ?? data.activeUsers ?? 0,
    verifiedUsers: data.verified_users ?? data.verifiedUsers ?? 0,
    newUsersToday: data.new_users_today ?? data.newUsersToday ?? 0,
    usersByRole: data.users_by_role ?? data.usersByRole ?? {
      admin: 0,
      farmer: 0,
      vendor: 0,
      transporter: 0,
      buyer: 0
    }
  };
  
  console.log('🔄 TRANSFORMED Stats:', transformed);
  return transformed;
};

export const useUserStats = (): UseUserStatsReturn => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Starting to fetch stats...');
      const statsData = await adminService.getUserStats();
      console.log('📊 RAW Stats data from API:', statsData);
      
      if (!statsData) {
        console.warn('⚠️ No stats data received from API');
        setStats(null);
        return;
      }
      
      const transformedStats = transformStatsResponse(statsData);
      console.log('📊 Final stats to set:', transformedStats);
      
      setStats(transformedStats);
    } catch (err: any) {
      console.error('❌ Error fetching stats:', err);
      console.error('❌ Error details:', err.response?.data || err.message);
      
      if (err.response?.status !== 401) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch statistics';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};