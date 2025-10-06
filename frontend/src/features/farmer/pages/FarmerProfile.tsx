// Dashboard/farmer/components/FarmerProfile.tsx
import React, { useState } from 'react';
import { useUpdateFarmer } from '../hooks/farmerHooks';
import type { FarmerResponse, UpdateFarmerRequest } from '../types/farmerTypes';
import { farmTypeLabels, certificationLabels } from '../utils/farmerUtils';

interface FarmerProfileProps {
  farmer: FarmerResponse;
}

export const FarmerProfile: React.FC<FarmerProfileProps> = ({ farmer }) => {
  const updateFarmerMutation = useUpdateFarmer();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateFarmerRequest>({
    full_name: farmer.full_name,
    farm_description: farmer.farm_description,
    address: farmer.address,
    city: farmer.city,
    state: farmer.state,
    zip_code: farmer.zip_code,
    alternate_phone: farmer.alternate_phone,
    website: farmer.website,
    total_land_area: farmer.total_land_area,
    employee_count: farmer.employee_count,
  });

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
      [name]: value,
    }));
  };

  if (isEditing) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Farm Description</label>
              <textarea
                name="farm_description"
                value={formData.farm_description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateFarmerMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
        <h2 className="text-2xl font-bold text-gray-900">Farm Profile</h2>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Farm Name</dt>
              <dd className="text-sm text-gray-900">{farmer.farm_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Farm Type</dt>
              <dd className="text-sm text-gray-900">{farmTypeLabels[farmer.farm_type]}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Experience</dt>
              <dd className="text-sm text-gray-900">{farmer.experience_years} years</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Land Area</dt>
              <dd className="text-sm text-gray-900">{farmer.total_land_area} acres</dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="text-sm text-gray-900">{farmer.address}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">City/State</dt>
              <dd className="text-sm text-gray-900">{farmer.city}, {farmer.state}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="text-sm text-gray-900">{farmer.alternate_phone || 'Not provided'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Website</dt>
              <dd className="text-sm text-gray-900">
                {farmer.website ? (
                  <a href={farmer.website} className="text-green-600 hover:text-green-700">
                    {farmer.website}
                  </a>
                ) : (
                  'Not provided'
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {farmer.certifications.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Certifications</h3>
          <div className="flex flex-wrap gap-2">
            {farmer.certifications.map(cert => (
              <span
                key={cert}
                className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
              >
                {certificationLabels[cert]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};