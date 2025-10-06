export type FarmType = 'organic' | 'conventional' | 'hydroponic' | 'aquaponic';
export type Certification = 'usda_organic' | 'eu_organic' | 'global_gap' | 'fair_trade';

export interface Farmer {
  id: string;
  user_id: string;
  full_name: string;
  profile_picture?: string;
  date_of_birth: string;
  experience_years: number;
  farm_name: string;
  farm_description?: string;
  farm_type: FarmType;
  certifications: Certification[];
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
  latitude: number;
  longitude: number;
  alternate_phone?: string;
  website?: string;
  total_land_area: number;
  annual_revenue?: number;
  employee_count: number;
  is_verified: boolean;
  is_premium: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

// Updated to match your API response
export interface FarmerResponse {
  id: string;
  user_id: string;
  full_name: string;
  profile_picture?: string;
  experience_years: number;
  farm_name: string;
  farm_description?: string;
  farm_type: FarmType;
  certifications: Certification[];
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  is_verified: boolean;
  is_premium: boolean;
  rating: number;
  review_count: number;
  product_count: number;
  active_listings: number;
  created_at: string;
  updated_at: string;
}

export interface FarmerStatsResponse {
  total_products: number;
  active_listings: number;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  total_revenue: number;
  average_rating: number;
  customer_count: number;
  this_month_revenue: number;
}

export interface FarmerListResponse {
  farmers: FarmerResponse[];
  total: number;
  page: number;
  pages: number;
  has_more: boolean;
}

// Request DTOs
export interface CreateFarmerRequest {
  full_name: string;
  profile_picture?: string;
  date_of_birth: string;
  experience_years: number;
  farm_name: string;
  farm_description?: string;
  farm_type: FarmType;
  certifications: Certification[];
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
  latitude: number;
  longitude: number;
  alternate_phone?: string;
  website?: string;
  total_land_area: number;
  employee_count: number;
}

export interface UpdateFarmerRequest {
  full_name?: string;
  profile_picture?: string;
  farm_description?: string;
  certifications?: Certification[];
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  alternate_phone?: string;
  website?: string;
  total_land_area?: number;
  employee_count?: number;
}

export interface FarmerFilterRequest {
  farm_type?: FarmType;
  certification?: Certification;
  city?: string;
  state?: string;
  country?: string;
  min_rating?: number;
  max_rating?: number;
  min_experience?: number;
  is_verified?: boolean;
  is_premium?: boolean;
  search?: string;
  sort_by?: 'rating' | 'experience_years' | 'created_at' | 'farm_name';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

// Form data types
export interface FarmerFormData {
  full_name: string;
  profile_picture?: string;
  date_of_birth: string;
  experience_years: number;
  farm_name: string;
  farm_description?: string;
  farm_type: FarmType;
  certifications: Certification[];
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
  latitude: number;
  longitude: number;
  alternate_phone?: string;
  website?: string;
  total_land_area: number;
  employee_count: number;
}