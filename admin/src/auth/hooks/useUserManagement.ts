import { useState, useEffect, useCallback } from 'react';
import adminService from '../services/adminService';
import type { UserResponse, Pagination, UserFilters, UpdateUserData } from '../types/user';

interface UseUserManagementReturn {
  users: UserResponse[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  filters: UserFilters;
  fetchUsers: (page?: number, filterParams?: UserFilters) => Promise<void>;
  updateUser: (userId: string, userData: UpdateUserData) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (userId: string, currentStatus: boolean) => Promise<{ success: boolean; error?: string }>;
  updateFilters: (newFilters: UserFilters) => void;
  changePage: (newPage: number) => void;
}

// Transform user data to match frontend types
const transformUserResponse = (user: any): UserResponse => {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.is_verified || user.isVerified || false,
    isActive: user.is_active || user.isActive || false,
    createdAt: user.created_at || user.createdAt
  };
};

export const useUserManagement = (): UseUserManagementReturn => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState<UserFilters>({
    role: '',
    search: ''
  });

  // Fetch users with current pagination and filters
  const fetchUsers = useCallback(async (page: number = pagination.page, filterParams: UserFilters = filters): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 Fetching users with:', { page, limit: pagination.limit, filterParams });
      const response = await adminService.getUsers(page, pagination.limit, filterParams);
      console.log('📋 Users response:', response);
      
      // Transform users data
      const transformedUsers = (response.users || []).map(transformUserResponse);
      console.log('📋 Transformed users:', transformedUsers);
      
      setUsers(transformedUsers);
      setPagination(response.pagination || {
        page: page,
        limit: pagination.limit,
        total: 0,
        pages: 0
      });
    } catch (err: any) {
      console.error('❌ Error fetching users:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch users';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Update user
  const updateUser = async (userId: string, userData: UpdateUserData): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('✏️ Updating user:', userId, userData);
      await adminService.updateUser(userId, userData);
      await fetchUsers(pagination.page, filters);
      return { success: true };
    } catch (err: any) {
      console.error('❌ Error updating user:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update user';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  // Delete user
  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🗑️ Deleting user:', userId);
      await adminService.deleteUser(userId);
      
      const shouldGoToPrevPage = users.length === 1 && pagination.page > 1;
      const newPage = shouldGoToPrevPage ? pagination.page - 1 : pagination.page;
      
      await fetchUsers(newPage, filters);
      return { success: true };
    } catch (err: any) {
      console.error('❌ Error deleting user:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete user';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (userId: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔄 Toggling user status:', userId, 'current:', currentStatus);
      if (currentStatus) {
        await adminService.deactivateUser(userId);
      } else {
        await adminService.activateUser(userId);
      }
      await fetchUsers(pagination.page, filters);
      return { success: true };
    } catch (err: any) {
      console.error('❌ Error toggling user status:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update user status';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  // Update filters and refetch
  const updateFilters = useCallback((newFilters: UserFilters): void => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchUsers(1, updatedFilters);
  }, [filters, fetchUsers]);

  // Change page
  const changePage = useCallback((newPage: number): void => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchUsers(newPage, filters);
  }, [filters, fetchUsers]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    pagination,
    filters,
    fetchUsers,
    updateUser,
    deleteUser,
    toggleUserStatus,
    updateFilters,
    changePage
  };
};