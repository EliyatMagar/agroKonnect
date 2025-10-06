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
    },
  });

  // Update farmer mutation
  const updateFarmerMutation = useMutation({
    mutationFn: (data: UpdateFarmerRequest) => farmerApi.updateFarmer(data),
    onSuccess: (data: FarmerResponse) => {
      queryClient.setQueryData(farmerKeys.myProfile(), data);
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
    },
  });

  // Delete farmer mutation
  const deleteFarmerMutation = useMutation({
    mutationFn: () => farmerApi.deleteFarmer(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: farmerKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
    },
  });

  // Verify farmer mutation (admin only)
  const verifyFarmerMutation = useMutation({
    mutationFn: (farmerId: string) => farmerApi.verifyFarmer(farmerId),
    onSuccess: (_, farmerId) => {
      queryClient.invalidateQueries({ queryKey: farmerKeys.detail(farmerId) });
      queryClient.invalidateQueries({ queryKey: farmerKeys.lists() });
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

// Get my farmer profile
export const useMyFarmerProfile = () => {
  return useQuery({
    queryKey: farmerKeys.myProfile(),
    queryFn: () => farmerApi.getMyProfile(),
    enabled: !!localStorage.getItem('access_token'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get farmer by ID
export const useFarmerById = (id: string) => {
  return useQuery({
    queryKey: farmerKeys.detail(id),
    queryFn: () => farmerApi.getFarmerById(id),
    enabled: !!id,
  });
};

// Get all farmers with filters
export const useFarmers = (filters?: Partial<FarmerFilterRequest>) => {
  return useQuery({
    queryKey: farmerKeys.list(filters),
    queryFn: () => farmerApi.getAllFarmers(filters),
  });
};

// Get farmer stats
export const useFarmerStats = () => {
  return useQuery({
    queryKey: farmerKeys.stats(),
    queryFn: () => farmerApi.getFarmerStats(),
    enabled: !!localStorage.getItem('access_token'),
  });
};

// Get nearby farmers
export const useNearbyFarmers = (lat: number, lng: number, radius?: number) => {
  return useQuery({
    queryKey: farmerKeys.nearby(lat, lng, radius),
    queryFn: () => farmerApi.getNearbyFarmers(lat, lng, radius),
    enabled: !!(lat && lng),
  });
};

// Search farmers
export const useSearchFarmers = (query: string, page?: number, size?: number) => {
  return useQuery({
    queryKey: farmerKeys.search(query, page, size),
    queryFn: () => farmerApi.searchFarmers(query, page, size),
    enabled: !!query,
  });
};

// Individual mutations for specific use cases
export const useCreateFarmer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateFarmerRequest) => farmerApi.createFarmer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmerKeys.myProfile() });
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
  });
};