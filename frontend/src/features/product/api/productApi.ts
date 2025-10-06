// api/productApi.ts
import type { 
  Product, 
  ProductResponse, 
  ProductListResponse, 
  CreateProductRequest, 
  UpdateProductRequest,
  ProductFilterRequest,
  AddReviewRequest,
  ProductReviewResponse,
  ApiResponse 
} from '../types/productTypes';

const API_BASE_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ProductApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('access_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  }

  // Product CRUD Operations
   async createProduct(data: CreateProductRequest): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProduct(id: string): Promise<ProductResponse> {
    return this.request<ProductResponse>(`/products/${id}`);
  }

  async getMyProducts(): Promise<ProductResponse[]> {
    return this.request<ProductResponse[]>('/products/me');
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<ProductResponse> {
    return this.request<ProductResponse>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getAllProducts(filters: ProductFilterRequest = {}): Promise<ProductListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const url = `/products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ProductListResponse>(url);
  }

  // Product Management
  async updateStock(id: string, quantity: number): Promise<void> {
    return this.request<void>(`/products/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    return this.request<void>(`/products/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Product Discovery
  async getFeaturedProducts(limit: number = 10): Promise<ProductResponse[]> {
    return this.request<ProductResponse[]>(`/products/featured?limit=${limit}`);
  }

  async getProductsByCategory(
    category: string, 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<ProductListResponse> {
    return this.request<ProductListResponse>(
      `/products/category/${category}?page=${page}&page_size=${pageSize}`
    );
  }

  async searchProducts(
    query: string, 
    page: number = 1, 
    size: number = 10
  ): Promise<ProductListResponse> {
    return this.request<ProductListResponse>(
      `/products/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`
    );
  }

  // Image Upload
  async uploadProductImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/products/images/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    const result = await response.json();
    return result.data;
  }

  async uploadMultipleProductImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/products/images/upload-multiple`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    const result = await response.json();
    return result.data;
  }

  async deleteProductImage(filename: string): Promise<void> {
    return this.request<void>(`/products/images/${filename}`, {
      method: 'DELETE',
    });
  }

  // Reviews
  async addReview(productId: string, data: AddReviewRequest): Promise<ProductReviewResponse> {
    return this.request<ProductReviewResponse>(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProductReviews(productId: string): Promise<ProductReviewResponse[]> {
    return this.request<ProductReviewResponse[]>(`/products/${productId}/reviews`);
  }
}

export const productApi = new ProductApiService();