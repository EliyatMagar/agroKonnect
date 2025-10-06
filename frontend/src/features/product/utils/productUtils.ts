// utils/productUtils.ts
import type { ProductCategory, QualityGrade, ProductStatus } from '../types/productTypes';

export const productCategories: { value: ProductCategory; label: string }[] = [
  { value: 'fruits', label: 'Fruits' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'grains', label: 'Grains' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'poultry', label: 'Poultry' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'spices', label: 'Spices' },
  { value: 'herbs', label: 'Herbs' },
];

export const qualityGrades: { value: QualityGrade; label: string }[] = [
  { value: 'premium', label: 'Premium' },
  { value: 'standard', label: 'Standard' },
  { value: 'economy', label: 'Economy' },
];

export const productStatuses: { value: ProductStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'sold_out', label: 'Sold Out' },
  { value: 'expired', label: 'Expired' },
];

export const units = [
  'kg', 'g', 'lb', 'oz', 'piece', 'dozen', 'bunch', 'pack', 'box', 'crate'
];

export const validateProductForm = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.name?.trim()) errors.push('Product name is required');
  if (!data.category) errors.push('Category is required');
  if (!data.price_per_unit || data.price_per_unit <= 0) errors.push('Valid price is required');
  if (!data.unit?.trim()) errors.push('Unit is required');
  if (data.available_stock < 0) errors.push('Stock cannot be negative');
  if (data.min_order <= 0) errors.push('Minimum order must be positive');
  if (data.max_order > 0 && data.max_order < data.min_order) {
    errors.push('Maximum order must be greater than minimum order');
  }
  if (data.harvest_date) {
    const harvestDate = new Date(data.harvest_date);
    if (harvestDate > new Date()) errors.push('Harvest date cannot be in the future');
  }

  return errors;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const calculateExpiryDate = (harvestDate: string, shelfLife: number): Date => {
  const harvest = new Date(harvestDate);
  return new Date(harvest.getTime() + shelfLife * 24 * 60 * 60 * 1000);
};

export const isProductExpired = (expiryDate: string): boolean => {
  return new Date(expiryDate) < new Date();
};

export const getProductImageUrl = (filename: string): string => {
  return `${import.meta.env.NEXT_PUBLIC_API_URL}/api/v1/products/images/${filename}`;
};

export const getCategoryIcon = (category: ProductCategory): string => {
  const icons: Record<ProductCategory, string> = {
    fruits: '🍎',
    vegetables: '🥦',
    grains: '🌾',
    dairy: '🥛',
    poultry: '🐔',
    livestock: '🐄',
    spices: '🌶️',
    herbs: '🌿',
  };
  return icons[category] || '📦';
};