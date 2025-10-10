export type BuyerType = 
  | 'retailer' 
  | 'wholesaler' 
  | 'exporter' 
  | 'processor' 
  | 'restaurant' 
  | 'supermarket';

export type BusinessScale = 
  | 'small' 
  | 'medium' 
  | 'large' 
  | 'enterprise';

export interface Buyer {
  id: string;
  user_id: string;
  business_name: string;
  business_type: BuyerType;
  business_scale: BusinessScale;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
  contact_person: string;
  designation?: string;
  alternate_phone?: string;
  website?: string;
  business_license: string;
  tax_id?: string;
  year_established: number;
  employee_count: number;
  monthly_volume: number;
  preferred_products: string[];
  quality_standards: string[];
  is_verified: boolean;
  is_premium: boolean;
  rating: number;
  credit_limit: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
}

export interface BuyerResponse {
  id: string;
  user_id: string;
  business_name: string;
  business_type: BuyerType;
  business_scale: BusinessScale;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  contact_person: string;
  website?: string;
  is_verified: boolean;
  is_premium: boolean;
  rating: number;
  monthly_volume: number;
  preferred_products: string[];
  year_established: number;
  employee_count: number;
  created_at: string;
}

export interface BuyerStatsResponse {
  total_orders: number;
  completed_orders: number;
  total_spent: number;
  favorite_farmers: number;
  average_rating: number;
}

export interface BuyerListResponse {
  buyers: BuyerResponse[];
  total: number;
  page: number;
  pages: number;
  has_more: boolean;
}

// Request DTOs
export interface CreateBuyerRequest {
  business_name: string;
  business_type: BuyerType;
  business_scale: BusinessScale;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
  contact_person: string;
  designation?: string;
  alternate_phone?: string;
  website?: string;
  business_license: string;
  tax_id?: string;
  year_established: number;
  employee_count: number;
  monthly_volume: number;
  preferred_products: string[];
  quality_standards: string[];
}

export interface UpdateBuyerRequest {
  business_name?: string;
  business_type?: BuyerType;
  business_scale?: BusinessScale;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  contact_person?: string;
  designation?: string;
  alternate_phone?: string;
  website?: string;
  business_license?: string;
  tax_id?: string;
  year_established?: number;
  employee_count?: number;
  monthly_volume?: number;
  preferred_products?: string[]; // Make optional
  quality_standards?: string[]; // Make optional
}

export interface BuyerFilterRequest {
  business_type?: BuyerType;
  business_scale?: BusinessScale;
  city?: string;
  state?: string;
  min_monthly_volume?: number;
  preferred_product?: string;
  is_verified?: boolean;
  is_premium?: boolean;
  page?: number;
  page_size?: number;
}

// Form data types
export interface BuyerFormData {
  business_name: string;
  business_type: BuyerType;
  business_scale: BusinessScale;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  contact_person: string;
  designation?: string;
  alternate_phone?: string;
  website?: string;
  business_license: string;
  tax_id?: string;
  year_established: number;
  employee_count: number;
  monthly_volume: number;
  preferred_products: string[];
  quality_standards: string[];
}