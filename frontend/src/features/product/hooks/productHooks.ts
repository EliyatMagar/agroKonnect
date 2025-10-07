// hooks/useProducts.ts
import { useState, useCallback } from 'react';
import type { 
  Product, 
  ProductResponse, 
  ProductListResponse, 
  CreateProductRequest, 
  UpdateProductRequest,
  ProductFilterRequest 
} from '../types/productTypes';
import { productApi } from '../api/productApi';

export const useProducts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = useCallback(async (data: CreateProductRequest): Promise<Product | null> => {
    setLoading(true);
    setError(null);
    try {
      const product = await productApi.createProduct(data);
      return product;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProduct = useCallback(async (id: string): Promise<ProductResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const product = await productApi.getProduct(id);
      return product;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyProducts = useCallback(async (): Promise<ProductResponse[]> => {
    setLoading(true);
    setError(null);
    try {
      const products = await productApi.getMyProducts();
      return products;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (
    id: string, 
    data: UpdateProductRequest
  ): Promise<ProductResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const product = await productApi.updateProduct(id, data);
      return product;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await productApi.deleteProduct(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllProducts = useCallback(async (
    filters: ProductFilterRequest = {}
  ): Promise<ProductListResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await productApi.getAllProducts(filters);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStock = useCallback(async (id: string, quantity: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await productApi.updateStock(id, quantity);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await productApi.updateStatus(id, status);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFeaturedProducts = useCallback(async (limit: number = 10): Promise<ProductResponse[]> => {
    setLoading(true);
    setError(null);
    try {
      const products = await productApi.getFeaturedProducts(limit);
      return products;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch featured products');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (
    query: string, 
    page: number = 1, 
    size: number = 10
  ): Promise<ProductListResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await productApi.searchProducts(query, page, size);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search products');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createProduct,
    getProduct,
    getMyProducts,
    updateProduct,
    deleteProduct,
    getAllProducts,
    updateStock,
    updateStatus,
    getFeaturedProducts,
    searchProducts,
  };
};

// Hook for product images
export const useProductImages = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true);
    setUploadError(null);
    try {
      const imageUrl = await productApi.uploadProductImage(file);
      return imageUrl;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadMultipleImages = useCallback(async (files: File[]): Promise<string[]> => {
    setUploading(true);
    setUploadError(null);
    try {
      const imageUrls = await productApi.uploadMultipleProductImages(files);
      return imageUrls;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload images');
      return [];
    } finally {
      setUploading(false);
    }
  }, []);

  const deleteImage = useCallback(async (filename: string): Promise<boolean> => {
    setUploading(true);
    setUploadError(null);
    try {
      await productApi.deleteProductImage(filename);
      return true;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to delete image');
      return false;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    uploading,
    uploadError,
    uploadImage,
    uploadMultipleImages,
    deleteImage,
  };
};

// Hook for product filters and search
export const useProductSearch = () => {
  const [filters, setFilters] = useState<ProductFilterRequest>({});
  const [searchQuery, setSearchQuery] = useState('');

  const updateFilter = useCallback((key: keyof ProductFilterRequest, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  return {
    filters,
    searchQuery,
    setSearchQuery,
    updateFilter,
    clearFilters,
  };
};