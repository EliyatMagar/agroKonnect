// hooks/useProductDetails.ts
import { useState, useCallback } from 'react';
import type { 
  ProductDetailsResponse, 
  ProductStats,
  AddReviewRequest,
  ProductReviewResponse 
} from '../types/productTypes'; // Make sure this import path is correct
import { productApi } from '../api/productApi';

export const useProductDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProductDetails = useCallback(async (id: string): Promise<ProductDetailsResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const details = await productApi.getProductDetails(id);
      return details;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product details');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductStats = useCallback(async (id: string): Promise<ProductStats | null> => {
    setLoading(true);
    setError(null);
    try {
      const stats = await productApi.getProductStats(id);
      return stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const trackProductView = useCallback(async (id: string): Promise<boolean> => {
    try {
      await productApi.incrementProductViews(id);
      return true;
    } catch (err) {
      console.error('Failed to track product view:', err);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    getProductDetails,
    getProductStats,
    trackProductView,
  };
};

// Add the missing useProductReviews hook here
export const useProductReviews = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addReview = useCallback(async (
    productId: string, 
    data: AddReviewRequest
  ): Promise<ProductReviewResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const review = await productApi.addReview(productId, data);
      return review;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add review');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getReviews = useCallback(async (productId: string): Promise<ProductReviewResponse[]> => {
    setLoading(true);
    setError(null);
    try {
      const reviews = await productApi.getProductReviews(productId);
      return reviews;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    addReview,
    getReviews,
  };
};