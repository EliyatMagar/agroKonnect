// Dashboard/farmer/components/FarmerProfile.tsx
import React, { useState, useEffect } from 'react';
import { useUpdateFarmer } from '../hooks/farmerHooks';
import type { FarmerResponse, UpdateFarmerRequest } from '../types/farmerTypes';
import { farmTypeLabels, certificationLabels } from '../utils/farmerUtils';

interface FarmerProfileProps {
  farmer: FarmerResponse | null | undefined;
}

export const FarmerProfile: React.FC<FarmerProfileProps> = ({ farmer }) => {
  const updateFarmerMutation = useUpdateFarmer();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateFarmerRequest>({
    full_name: '',
    farm_description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    alternate_phone: '',
    website: '',
    total_land_area: 0,
    employee_count: 0,
  });

  // Initialize form data when farmer is available
  useEffect(() => {
    if (farmer) {
      setFormData({
        full_name: farmer.full_name || '',
        farm_description: farmer.farm_description || '',
        address: farmer.address || '',
        city: farmer.city || '',
        state: farmer.state || '',
        zip_code: farmer.zip_code || '',
        alternate_phone: farmer.alternate_phone || '',
        website: farmer.website || '',
        total_land_area: farmer.total_land_area || 0,
        employee_count: farmer.employee_count || 0,
      });
    }
  }, [farmer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFarmerMutation.mutate(formData, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_land_area' || name === 'employee_count' ? Number(value) : value,
    }));
  };

  // Loading state
  if (!farmer) {
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
            <h2 className="text-2xl font-bold text-gray-900">Edit Farm Profile</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Land Area (acres)</label>
              <input
                type="number"
                name="total_land_area"
                value={formData.total_land_area}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee Count</label>
              <input
                type="number"
                name="employee_count"
                value={formData.employee_count}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone</label>
              <input
                type="tel"
                name="alternate_phone"
                value={formData.alternate_phone}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Farm Description</label>
              <textarea
                name="farm_description"
                value={formData.farm_description}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
                placeholder="https://example.com"
              />
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
              disabled={updateFarmerMutation.isPending}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateFarmerMutation.isPending ? 'Updating...' : 'Update Profile'}
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
          <h2 className="text-2xl font-bold text-gray-900">Farm Profile</h2>
          <p className="text-gray-600 mt-1">Manage your farm information and contact details</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Basic Information</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Farm Name</dt>
              <dd className="text-sm text-gray-900 mt-1">{farmer.farm_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="text-sm text-gray-900 mt-1">{farmer.full_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Farm Type</dt>
              <dd className="text-sm text-gray-900 mt-1">{farmTypeLabels[farmer.farm_type] || farmer.farm_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Experience</dt>
              <dd className="text-sm text-gray-900 mt-1">{farmer.experience_years} years</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Land Area</dt>
              <dd className="text-sm text-gray-900 mt-1">{farmer.total_land_area} acres</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Employees</dt>
              <dd className="text-sm text-gray-900 mt-1">{farmer.employee_count}</dd>
            </div>
          </dl>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Contact Information</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="text-sm text-gray-900 mt-1">{farmer.address}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">City/State</dt>
              <dd className="text-sm text-gray-900 mt-1">{farmer.city}, {farmer.state}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Country</dt>
              <dd className="text-sm text-gray-900 mt-1">{farmer.country}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Alternate Phone</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {farmer.alternate_phone || (
                  <span className="text-gray-400 italic">Not provided</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Website</dt>
              <dd className="text-sm text-gray-900 mt-1">
                {farmer.website ? (
                  <a 
                    href={farmer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 underline"
                  >
                    {farmer.website}
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Not provided</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Farm Description */}
      {farmer.farm_description && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Farm Description</h3>
          <p className="text-gray-700 leading-relaxed">{farmer.farm_description}</p>
        </div>
      )}

      {/* Certifications */}
      {farmer.certifications && farmer.certifications.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
          <div className="flex flex-wrap gap-2">
            {farmer.certifications.map(cert => (
              <span
                key={cert}
                className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium"
              >
                {certificationLabels[cert] || cert}
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
            farmer.is_verified 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {farmer.is_verified ? '✓ Verified' : 'Pending Verification'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            farmer.is_premium 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {farmer.is_premium ? '⭐ Premium' : 'Standard'}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Rating: {farmer.rating}/5 ({farmer.review_count} reviews)
          </span>
        </div>
      </div>
    </div>
  );
};