export type UserRole = 'farmer' | 'vendor' | 'transporter' | 'buyer' | 'admin';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  farmerId?: string;
  vendorId?: string;
  transporterId?: string;
  buyerId?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  usersByRole: Record<UserRole, number>;
  newUsersToday: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UsersResponse {
  users: UserResponse[];
  pagination: Pagination;
}

export interface UpdateUserData {
  email?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserFilters {
  role?: string;
  search?: string;
}