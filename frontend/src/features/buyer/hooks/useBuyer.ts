// features/buyer/hooks/useBuyer.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buyerApi } from '../api/buyerApi';
import type { 
  CreateBuyerRequest,
  UpdateBuyerRequest,
  BuyerFilterRequest
} from '../types/buyerTypes';

// Query keys
export const buyerKeys = {
  all: ['buyers'] as const,
  lists: () => [...buyerKeys.all, 'list'] as const,
  list: (filters: any) => [...buyerKeys.lists(), { filters }] as const,
  details: () => [...buyerKeys.all, 'detail'] as const,
  detail: (id: string) => [...buyerKeys.details(), id] as const,
  myProfile: () => [...buyerKeys.all, 'my-profile'] as const,
  stats: (id: string) => [...buyerKeys.all, 'stats', id] as const,
  myStats: () => [...buyerKeys.all, 'my-stats'] as const,
};

// Main buyer hook
export const useBuyer = () => {
  const queryClient = useQueryClient();

  // Create buyer mutation
  const createBuyerMutation = useMutation({
    mutationFn: (data: CreateBuyerRequest) => buyerApi.createBuyer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buyerKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
  });

  // Update buyer mutation
  const updateBuyerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBuyerRequest }) => 
      buyerApi.updateBuyer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: buyerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: buyerKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
  });

  // Delete buyer mutation
  const deleteBuyerMutation = useMutation({
    mutationFn: (id: string) => buyerApi.deleteBuyer(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: buyerKeys.detail(id) });
      queryClient.removeQueries({ queryKey: buyerKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
  });

  // Verify buyer mutation (admin only)
  const verifyBuyerMutation = useMutation({
    mutationFn: (buyerId: string) => buyerApi.verifyBuyer(buyerId),
    onSuccess: (_, buyerId) => {
      queryClient.invalidateQueries({ queryKey: buyerKeys.detail(buyerId) });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
  });

  // Update premium status mutation (admin only)
  const updatePremiumMutation = useMutation({
    mutationFn: ({ buyerId, premium }: { buyerId: string; premium: boolean }) => 
      buyerApi.updatePremiumStatus(buyerId, premium),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: buyerKeys.detail(variables.buyerId) });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
  });

  return {
    // Mutations
    createBuyer: createBuyerMutation,
    updateBuyer: updateBuyerMutation,
    deleteBuyer: deleteBuyerMutation,
    verifyBuyer: verifyBuyerMutation,
    updatePremiumStatus: updatePremiumMutation,
    
    // States
    isLoading: createBuyerMutation.isPending || updateBuyerMutation.isPending,
  };
};

// Get my buyer profile - UPDATED with enabled parameter
export const useMyBuyerProfile = (enabled: boolean = true) => {
  return useQuery({
    queryKey: buyerKeys.myProfile(),
    queryFn: () => buyerApi.getMyProfile(),
    enabled: enabled && !!localStorage.getItem('access_token'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 - buyer profile doesn't exist
      if (error?.status === 404) {
        console.log('🔄 Buyer profile not found (404), not retrying...');
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
          console.error('💥 Error fetching buyer profile:', error);
        }
      }
    }
  });
};

// Get buyer by ID
export const useBuyerById = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: buyerKeys.detail(id),
    queryFn: () => buyerApi.getBuyerById(id),
    enabled: enabled && !!id,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

// Get all buyers with filters
export const useBuyers = (filters?: Partial<BuyerFilterRequest>) => {
  return useQuery({
    queryKey: buyerKeys.list(filters),
    queryFn: () => buyerApi.getAllBuyers(filters),
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
  });
};

// Get buyer stats
export const useBuyerStats = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: buyerKeys.stats(id),
    queryFn: () => buyerApi.getBuyerStats(id),
    enabled: enabled && !!id,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

// Get my buyer stats
export const useMyBuyerStats = (enabled: boolean = true) => {
  const { data: profile, isLoading: profileLoading } = useMyBuyerProfile(enabled);
  
  return useQuery({
    queryKey: buyerKeys.myStats(),
    queryFn: () => {
      if (!profile) {
        throw new Error('No buyer profile found');
      }
      return buyerApi.getBuyerStats(profile.id);
    },
    enabled: enabled && !!profile && !profileLoading,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
};

// Individual mutations for specific use cases
export const useCreateBuyer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBuyerRequest) => buyerApi.createBuyer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buyerKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
    onError: (error: any) => {
      console.error('💥 Error creating buyer:', error);
    },
  });
};

export const useUpdateBuyer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBuyerRequest }) => 
      buyerApi.updateBuyer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: buyerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: buyerKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
    onError: (error: any) => {
      console.error('💥 Error updating buyer:', error);
    },
  });
};

export const useDeleteBuyer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => buyerApi.deleteBuyer(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: buyerKeys.detail(id) });
      queryClient.removeQueries({ queryKey: buyerKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
    onError: (error: any) => {
      console.error('💥 Error deleting buyer:', error);
    },
  });
};

// Additional utility hooks

// Hook to check if current user has a buyer profile
export const useHasBuyerProfile = () => {
  const { data: profile, isLoading, error } = useMyBuyerProfile();
  
  return {
    hasProfile: !!profile,
    isLoading,
    error,
    profile
  };
};

// Hook for buyer profile with automatic retry disabled for 404s
export const useBuyerProfileConditional = (shouldFetch: boolean) => {
  return useMyBuyerProfile(shouldFetch);
};

// Hook for creating buyer with optimistic updates
export const useCreateBuyerWithOptimistic = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBuyerRequest) => buyerApi.createBuyer(data),
    onMutate: async (newBuyer) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: buyerKeys.myProfile() });
      
      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(buyerKeys.myProfile());
      
      // Return a context object with the snapshotted value
      return { previousProfile };
    },
    onError: (err, newBuyer, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData(buyerKeys.myProfile(), context.previousProfile);
      }
      console.error('💥 Error creating buyer with optimistic update:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buyerKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
  });
};