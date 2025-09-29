export type UserRole = 'farmer' | 'vendor' | 'transporter' | 'buyer' | 'admin';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  farmer_id?: string;
  vendor_id?: string;
  transporter_id?: string;
  buyer_id?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_at: string;
}

export interface UserResponse {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface PaginatedResponse<T> {
  users: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserStats {
  total_users: number;
  active_users: number;
  verified_users: number;
  users_by_role: Record<UserRole, number>;
  new_users_today: number;
}

export interface UpdateUserRequest {
  email?: string;
  phone?: string;
  role?: UserRole;
  is_active?: boolean;
}