import type { BuyerType, BusinessScale } from "../types/buyerTypes";

export const buyerTypeLabels: Record<BuyerType, string> = {
  retailer: 'Retailer',
  wholesaler: 'Wholesaler',
  exporter: 'Exporter',
  processor: 'Processor',
  restaurant: 'Restaurant',
  supermarket: 'Supermarket',
};

export const businessScaleLabels: Record<BusinessScale, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  enterprise: 'Enterprise',
};

export const buyerTypeOptions = Object.entries(buyerTypeLabels).map(([value, label]) => ({
  value: value as BuyerType,
  label,
}));

export const businessScaleOptions = Object.entries(businessScaleLabels).map(([value, label]) => ({
  value: value as BusinessScale,
  label,
}));

// Common product categories for buyers
export const commonProducts = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Meat',
  'Poultry',
  'Seafood',
  'Herbs',
  'Spices',
  'Nuts',
  'Organic Produce',
  'Processed Foods'
];

// Quality standards
export const qualityStandards = [
  'ISO 22000',
  'HACCP',
  'GMP',
  'GlobalG.A.P.',
  'Organic Certified',
  'Fair Trade',
  'Kosher',
  'Halal',
  'Non-GMO',
  'Sustainably Sourced'
];

// Validation helpers
export const validateYearEstablished = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear;
};

export const validateMonthlyVolume = (volume: number): boolean => {
  return volume >= 0;
};

export const validateEmployeeCount = (count: number): boolean => {
  return count >= 0;
};

// Formatting helpers
export const formatMonthlyVolume = (volume: number, currency: string = 'USD'): string => {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M ${currency}`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K ${currency}`;
  }
  return `${volume.toLocaleString()} ${currency}`;
};

export const formatEmployeeCount = (count: number): string => {
  if (count === 0) return 'No employees';
  if (count === 1) return '1 employee';
  return `${count.toLocaleString()} employees`;
};

export const formatBusinessAge = (year: number): string => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  if (age === 0) return 'Established this year';
  if (age === 1) return '1 year in business';
  return `${age} years in business`;
};

// Filter helpers
export const buildBuyerFilters = (filters: any): Record<string, string> => {
  const params: Record<string, string> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = String(value);
    }
  });
  
  return params;
};

// Rating helpers
export const calculateAverageRating = (ratings: number[]): number => {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 100) / 100;
};

// Verification badge helper
export const getVerificationBadge = (isVerified: boolean, isPremium: boolean) => {
  if (isPremium) return { text: 'Premium', color: 'gold' };
  if (isVerified) return { text: 'Verified', color: 'blue' };
  return { text: 'Unverified', color: 'gray' };
};