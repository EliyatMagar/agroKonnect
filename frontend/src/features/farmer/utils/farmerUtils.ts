import type { FarmType, Certification } from "../types/farmerTypes";

export const farmTypeLabels: Record<FarmType, string> = {
  organic: 'Organic',
  conventional: 'Conventional',
  hydroponic: 'Hydroponic',
  aquaponic: 'Aquaponic',
};

export const certificationLabels: Record<Certification, string> = {
  usda_organic: 'USDA Organic',
  eu_organic: 'EU Organic',
  global_gap: 'Global G.A.P.',
  fair_trade: 'Fair Trade',
};

export const farmTypeOptions = Object.entries(farmTypeLabels).map(([value, label]) => ({
  value: value as FarmType,
  label,
}));

export const certificationOptions = Object.entries(certificationLabels).map(([value, label]) => ({
  value: value as Certification,
  label,
}));

// Validation helpers
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const validateDateOfBirth = (dateString: string): boolean => {
  const dob = new Date(dateString);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
};

// Formatting helpers
export const formatExperience = (years: number): string => {
  if (years === 0) return 'Less than 1 year';
  if (years === 1) return '1 year';
  return `${years} years`;
};

export const formatLandArea = (area: number, unit: 'acres' | 'hectares' = 'acres'): string => {
  return `${area.toLocaleString()} ${unit}`;
};

export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Filter helpers
export const buildFarmerFilters = (filters: any): Record<string, string> => {
  const params: Record<string, string> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = String(value);
    }
  });
  
  return params;
};