// features/farmer/hooks/farmerHooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { farmerApi } from '../api/farmerApi';
import type { 
  Farmer,
  FarmerResponse,
  CreateFarmerRequest,
  UpdateFarmerRequest,
  FarmerFilterRequest
} from '../types/farmerTypes';

// Query keys
export const farmerKeys = {
  all: ['farmers'] as const,
  lists: () => [...farmerKeys.all, 'list'] as const,
  list: (filters: any) => [...farmerKeys.lists(), { filters }] as const,
  details: () => [...farmerKeys.all, 'detail'] as const,
  detail: (id: string) => [...farmerKeys.details(), id] as const,
  myProfile: () => [...farmerKeys.all, 'my-profile'] as const,
  stats: () => [...farmerKeys.all, 'stats'] as const,
  nearby: (lat: number, lng: number, radius?: number) => 
    [...farmerKeys.all, 'nearby', { lat, lng, radius }] as const,
  search: (query: string, page?: number, size?: number) => 
    [...farmerKeys.all, 'search', { query, page, size }] as const,
};

// Main farmer hook
export const useFarmer = () => {
  const queryClient = useQueryClient();

  // Create farmer mutation
  const createFarmerMutation = useMutation({
    mutationFn: (data: CreateFarmerRequest) => farmerApi.createFarmer(data),
    onSuccess: (data: Farmer) => {
      queryClient.invalidateQueries({ queryKey: farmerKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
    },
    onError: (error: any) => {
      console.error('💥 Error creating farmer:', error);
    },
  });

  // Update farmer mutation
  const updateFarmerMutation = useMutation({
    mutationFn: (data: UpdateFarmerRequest) => farmerApi.updateFarmer(data),
    onSuccess: (data: FarmerResponse) => {
      queryClient.setQueryData(farmerKeys.myProfile(), data);
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
    },
    onError: (error: any) => {
      console.error('💥 Error updating farmer:', error);
    },
  });

  // Delete farmer mutation
  const deleteFarmerMutation = useMutation({
    mutationFn: () => farmerApi.deleteFarmer(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: farmerKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
    },
    onError: (error: any) => {
      console.error('💥 Error deleting farmer:', error);
    },
  });

  // Verify farmer mutation (admin only)
  const verifyFarmerMutation = useMutation({
    mutationFn: (farmerId: string) => farmerApi.verifyFarmer(farmerId),
    onSuccess: (_, farmerId) => {
      queryClient.invalidateQueries({ queryKey: farmerKeys.detail(farmerId) });
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
    },
    onError: (error: any) => {
      console.error('💥 Error verifying farmer:', error);
    },
  });

  return {
    // Mutations
    createFarmer: createFarmerMutation,
    updateFarmer: updateFarmerMutation,
    deleteFarmer: deleteFarmerMutation,
    verifyFarmer: verifyFarmerMutation,
    
    // States
    isLoading: createFarmerMutation.isPending || updateFarmerMutation.isPending,
  };
};

// Get my farmer profile - UPDATED with enabled parameter
export const useMyFarmerProfile = (enabled: boolean = true) => {
  return useQuery({
    queryKey: farmerKeys.myProfile(),
    queryFn: () => farmerApi.getMyProfile(),
    enabled: enabled && !!localStorage.getItem('access_token'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 - farmer profile doesn't exist
      if (error?.status === 404) {
        console.log('🔄 Farmer profile not found (404), not retrying...');
        return false;
      }
      
      // Don't retry on 401 - authentication error
      if (error?.status === 401) {
        console.log('🔄 Authentication error (401), not retrying...');
        return false;
      }
      
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    meta: {
      onError: (error: any) => {
        // Only log errors when the query is actually enabled
        if (enabled) {
          console.error('💥 Error fetching farmer profile:', error);
        }
      }
    }
  });
};

// Get farmer by ID
export const useFarmerById = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: farmerKeys.detail(id),
    queryFn: () => farmerApi.getFarmerById(id),
    enabled: enabled && !!id,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

// Get all farmers with filters
export const useFarmers = (filters?: Partial<FarmerFilterRequest>) => {
  return useQuery({
    queryKey: farmerKeys.list(filters),
    queryFn: () => farmerApi.getAllFarmers(filters),
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
  });
};

// Get farmer stats
export const useFarmerStats = (enabled: boolean = true) => {
  return useQuery({
    queryKey: farmerKeys.stats(),
    queryFn: () => farmerApi.getFarmerStats(),
    enabled: enabled && !!localStorage.getItem('access_token'),
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

// Get nearby farmers
export const useNearbyFarmers = (lat: number, lng: number, radius?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: farmerKeys.nearby(lat, lng, radius),
    queryFn: () => farmerApi.getNearbyFarmers(lat, lng, radius),
    enabled: enabled && !!(lat && lng),
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

// Search farmers
export const useSearchFarmers = (query: string, page?: number, size?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: farmerKeys.search(query, page, size),
    queryFn: () => farmerApi.searchFarmers(query, page, size),
    enabled: enabled && !!query,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

// Individual mutations for specific use cases
export const useCreateFarmer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateFarmerRequest) => farmerApi.createFarmer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmerKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
    },
    onError: (error: any) => {
      console.error('💥 Error creating farmer:', error);
    },
  });
};

export const useUpdateFarmer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateFarmerRequest) => farmerApi.updateFarmer(data),
    onSuccess: (data: FarmerResponse) => {
      queryClient.setQueryData(farmerKeys.myProfile(), data);
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
    },
    onError: (error: any) => {
      console.error('💥 Error updating farmer:', error);
    },
  });
};

export const useDeleteFarmer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => farmerApi.deleteFarmer(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: farmerKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
    },
    onError: (error: any) => {
      console.error('💥 Error deleting farmer:', error);
    },
  });
};

// Additional utility hooks

// Hook to check if current user has a farmer profile
export const useHasFarmerProfile = () => {
  const { data: profile, isLoading, error } = useMyFarmerProfile();
  
  return {
    hasProfile: !!profile,
    isLoading,
    error,
    profile
  };
};

// Hook for farmer profile with automatic retry disabled for 404s
export const useFarmerProfileConditional = (shouldFetch: boolean) => {
  return useMyFarmerProfile(shouldFetch);
};

// Hook for creating farmer with optimistic updates
export const useCreateFarmerWithOptimistic = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateFarmerRequest) => farmerApi.createFarmer(data),
    onMutate: async (newFarmer) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: farmerKeys.myProfile() });
      
      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(farmerKeys.myProfile());
      
      // Optimistically update to the new value
      queryClient.setQueryData(farmerKeys.myProfile(), {
        ...newFarmer,
        id: 'temp-id', // Temporary ID until real response
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      // Return a context object with the snapshotted value
      return { previousProfile };
    },
    onError: (err, newFarmer, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData(farmerKeys.myProfile(), context.previousProfile);
      }
      console.error('💥 Error creating farmer with optimistic update:', err);
    },
    onSuccess: (data) => {
      // Update with the real data from server
      queryClient.setQueryData(farmerKeys.myProfile(), data);
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
    },
  });
};

// Hook to get farmer profile only if user is a farmer
export const useFarmerProfileIfFarmer = (userRole: string | null) => {
  const isFarmer = userRole === 'farmer';
  return useMyFarmerProfile(isFarmer);
};