// types.ts
export type ProductCategory = 
  | 'fruits' 
  | 'vegetables' 
  | 'grains' 
  | 'dairy' 
  | 'poultry' 
  | 'livestock' 
  | 'spices' 
  | 'herbs';

export type ProductStatus = 
  | 'draft' 
  | 'active' 
  | 'inactive' 
  | 'sold_out' 
  | 'expired';

export type QualityGrade = 
  | 'premium' 
  | 'standard' 
  | 'economy';

export interface Product {
  id: string;
  farmer_id: string;
  
  // Basic Information
  name: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  images: string[];

  // Pricing & Quantity
  price_per_unit: number;
  unit: string;
  available_stock: number;
  min_order: number;
  max_order: number;

  // Quality Information
  quality_grade: QualityGrade;
  organic: boolean;
  certified: boolean;
  certification_details: string;

  // Harvest Information
  harvest_date: string;
  shelf_life: number;
  storage_tips: string;

  // Product Specifications
  weight_range: string;
  color: string;
  size: string;
  variety: string;

  // Status
  status: ProductStatus;
  is_featured: boolean;
  rating: number;
  review_count: number;

  // Location
  farm_location: string;
  latitude: number;
  longitude: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  expiry_date: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  buyer_id: string;
  order_id: string;

  rating: number;
  title: string;
  comment: string;
  images: string[];

  quality_rating: number;
  value_rating: number;

  is_verified: boolean;
  helpful: number;

  created_at: string;
  updated_at: string;
}

// Request DTOs
export interface CreateProductRequest {
  name: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  images: string[];

  price_per_unit: number;
  unit: string;
  available_stock: number;
  min_order: number;
  max_order: number;

  quality_grade: QualityGrade;
  organic: boolean;
  certified: boolean;
  certification_details: string;

  harvest_date: string;
  shelf_life: number;
  storage_tips: string;

  weight_range: string;
  color: string;
  size: string;
  variety: string;

  farm_location: string;
  latitude: number;
  longitude: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  images?: string[];

  price_per_unit?: number;
  available_stock?: number;
  min_order?: number;
  max_order?: number;

  storage_tips?: string;
  status?: ProductStatus;
}

export interface ProductFilterRequest {
  category?: ProductCategory;
  farmer_id?: string;
  min_price?: number;
  max_price?: number;
  organic?: boolean;
  certified?: boolean;
  quality_grade?: QualityGrade;
  city?: string;
  state?: string;
  min_rating?: number;
  page?: number;
  page_size?: number;
}

export interface AddReviewRequest {
  rating: number;
  title: string;
  comment: string;
  images: string[];
  quality_rating: number;
  value_rating: number;
}

// Response DTOs
export interface ProductResponse {
  id: string;
  farmer_id: string;
  farmer_name: string;
  farm_name: string;

  name: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  images: string[];

  price_per_unit: number;
  unit: string;
  available_stock: number;
  min_order: number;
  max_order: number;

  quality_grade: QualityGrade;
  organic: boolean;
  certified: boolean;
  certification_details: string;

  harvest_date: string;
  shelf_life: number;
  storage_tips: string;

  weight_range: string;
  color: string;
  size: string;
  variety: string;
  latitude: number;
  longitude: number;

  status: ProductStatus;
  is_featured: boolean;
  rating: number;
  review_count: number;

  farm_location: string;
  distance?: number;

  created_at: string;
}

export interface ProductReviewResponse {
  id: string;
  product_id: string;
  buyer_id: string;
  buyer_name: string;
  order_id: string;

  rating: number;
  title: string;
  comment: string;
  images: string[];

  quality_rating: number;
  value_rating: number;

  is_verified: boolean;
  helpful: number;

  created_at: string;
}

export interface ProductListResponse {
  products: ProductResponse[];
  total: number;
  page: number;
  pages: number;
  has_more: boolean;
}

export interface UpdateStockRequest {
  quantity: number;
}

export interface UpdateStatusRequest {
  status: ProductStatus;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Form Data Types
export interface ProductFormData {
  name: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  images: (File | string)[];

  price_per_unit: number;
  unit: string;
  available_stock: number;
  min_order: number;
  max_order: number;

  quality_grade: QualityGrade;
  organic: boolean;
  certified: boolean;
  certification_details: string;

  harvest_date: string;
  shelf_life: number;
  storage_tips: string;

  weight_range: string;
  color: string;
  size: string;
  variety: string;

  farm_location: string;
  latitude: number;
  longitude: number;
}

export type ProductFormSubmission = Omit<CreateProductRequest, 'images'> & {
  images: string[]; // Only string URLs for API submission
};