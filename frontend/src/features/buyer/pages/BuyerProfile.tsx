import React, { useState, useEffect } from 'react';
import { useUpdateBuyer } from '../hooks/useBuyer';
import type { BuyerResponse, UpdateBuyerRequest } from '../types/buyerTypes';
import { buyerTypeLabels, businessScaleLabels, commonProducts } from '../utils/buyerUtils'; // Remove qualityStandards import

interface BuyerProfileProps {
  buyer: BuyerResponse | null | undefined;
}

export const BuyerProfile: React.FC<BuyerProfileProps> = ({ buyer }) => {
  const updateBuyerMutation = useUpdateBuyer();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateBuyerRequest>({
    business_name: '',
    business_type: 'retailer',
    business_scale: 'small',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip_code: '',
    contact_person: '',
    designation: '',
    alternate_phone: '',
    website: '',
    business_license: '',
    tax_id: '',
    year_established: new Date().getFullYear(),
    employee_count: 0,
    monthly_volume: 0,
    preferred_products: [],
    quality_standards: [],
  });

  // Initialize form data when buyer is available
  useEffect(() => {
    if (buyer) {
      setFormData({
        business_name: buyer.business_name || '',
        business_type: buyer.business_type || 'retailer',
        business_scale: buyer.business_scale || 'small',
        description: buyer.description || '',
        address: buyer.address || '',
        city: buyer.city || '',
        state: buyer.state || '',
        country: buyer.country || '',
        zip_code: buyer.zip_code || '', // Now this should work
        contact_person: buyer.contact_person || '',
        designation: buyer.designation || '',
        alternate_phone: buyer.alternate_phone || '',
        website: buyer.website || '',
        business_license: buyer.business_license || '',
        tax_id: buyer.tax_id || '',
        year_established: buyer.year_established || new Date().getFullYear(),
        employee_count: buyer.employee_count || 0,
        monthly_volume: buyer.monthly_volume || 0,
        preferred_products: buyer.preferred_products || [], // Ensure array
        quality_standards: buyer.quality_standards || [], // Ensure array
      });
    }
  }, [buyer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyer) return;
    
    updateBuyerMutation.mutate(
      { id: buyer.id, data: formData },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year_established' || name === 'employee_count' || name === 'monthly_volume' 
        ? Number(value) 
        : value,
    }));
  };

  const handleArrayChange = (field: 'preferred_products' | 'quality_standards', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...(prev[field] || []), value] // Handle undefined case
        : (prev[field] || []).filter(item => item !== value)
    }));
  };

  // Loading state
  if (!buyer) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Business Profile</h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
              <select
                name="business_type"
                value={formData.business_type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(buyerTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Scale</label>
              <select
                name="business_scale"
                value={formData.business_scale}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(businessScaleLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year Established</label>
              <input
                type="number"
                name="year_established"
                value={formData.year_established}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee Count</label>
              <input
                type="number"
                name="employee_count"
                value={formData.employee_count}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Volume ($)</label>
              <input
                type="number"
                name="monthly_volume"
                value={formData.monthly_volume}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone</label>
              <input
                type="tel"
                name="alternate_phone"
                value={formData.alternate_phone || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Preferred Products */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Products</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {commonProducts.map(product => (
                <label key={product} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(formData.preferred_products || []).includes(product)}
                    onChange={(e) => handleArrayChange('preferred_products', product, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{product}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateBuyerMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateBuyerMutation.isPending ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Profile</h2>
          <p className="text-gray-600 mt-1">Manage your business information and purchasing details</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Business Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Business Information</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Business Name</dt>
              <dd className="text-sm text-gray-900 mt-1">{buyer.business_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Business Type</dt>
              <dd className="text-sm text-gray-900 mt-1">{buyerTypeLabels[buyer.business_type] || buyer.business_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Business Scale</dt>
              <dd className="text-sm text-gray-900 mt-1">{businessScaleLabels[buyer.business_scale] || buyer.business_scale}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
              <dd className="text-sm text-gray-900 mt-1">{buyer.contact_person}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Year Established</dt>
              <dd className="text-sm text-gray-900 mt-1">{buyer.year_established}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Employees</dt>
              <dd className="text-sm text-gray-900 mt-1">{buyer.employee_count}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Monthly Volume</dt>
              <dd className="text-sm text-gray-900 mt-1">${buyer.monthly_volume.toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Contact Information</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="text-sm text-gray-900 mt-1">{buyer.address}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">City/State</dt>
              <dd className="text-sm text-gray-900 mt-1">{buyer.city}, {buyer.state}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Country</dt>
              <dd className="text-sm text-gray-900 mt-1">{buyer.country}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">ZIP Code</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {buyer.zip_code || (
                  <span className="text-gray-400 italic">Not provided</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Website</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {buyer.website ? (
                  <a 
                    href={buyer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    {buyer.website}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Not provided</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Business Description */}
      {buyer.description && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Description</h3>
          <p className="text-gray-700 leading-relaxed">{buyer.description}</p>
        </div>
      )}

      {/* Preferred Products */}
      {buyer.preferred_products && buyer.preferred_products.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferred Products</h3>
          <div className="flex flex-wrap gap-2">
            {buyer.preferred_products.map(product => (
              <span
                key={product}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
              >
                {product}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status Badges */}
      <div className="mt-8 pt-6 border-t">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
        <div className="flex flex-wrap gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            buyer.is_verified 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {buyer.is_verified ? '✓ Verified' : 'Pending Verification'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            buyer.is_premium 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {buyer.is_premium ? '⭐ Premium' : 'Standard'}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Rating: {buyer.rating}/5
          </span>
        </div>
      </div>
    </div>
  );
};