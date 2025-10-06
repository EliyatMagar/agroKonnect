// Dashboard/farmer/CreateFarmerProfile.tsx
import React, { useState } from 'react';
import { useCreateFarmer } from '../../features/farmer/hooks/farmerHooks';
import type { CreateFarmerRequest, FarmType, Certification } from '../../features/farmer/types/farmerTypes';
import { farmTypeOptions, certificationOptions } from '../../features/farmer/utils/farmerUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

export const CreateFarmerProfile: React.FC = () => {
  const [formData, setFormData] = useState<CreateFarmerRequest>({
    full_name: '',
    date_of_birth: '',
    experience_years: 0,
    farm_name: '',
    farm_description: '',
    farm_type: 'organic',
    certifications: [],
    address: '',
    city: '',
    state: '',
    country: '',
    zip_code: '',
    latitude: 0,
    longitude: 0,
    alternate_phone: '',
    website: '',
    total_land_area: 0,
    employee_count: 1,
  });

  const navigate = useNavigate();
  const createFarmerMutation = useCreateFarmer();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      const certification = value as Certification;
      
      setFormData(prev => ({
        ...prev,
        certifications: checked
          ? [...prev.certifications, certification]
          : prev.certifications.filter(c => c !== certification)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createFarmerMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Farmer profile created successfully!');
        setTimeout(() => {
          navigate('/farmer/dashboard');
        }, 1500);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create farmer profile');
      }
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          toast.success('Location detected successfully!');
        },
        (error) => {
          toast.error('Unable to detect location. Please enter manually.');
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Complete Your Farmer Profile</h2>
            <p className="mt-1 text-sm text-gray-600">
              Please provide your farming details to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  required
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Farm Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="farm_name" className="block text-sm font-medium text-gray-700">
                  Farm Name *
                </label>
                <input
                  type="text"
                  id="farm_name"
                  name="farm_name"
                  required
                  value={formData.farm_name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="farm_type" className="block text-sm font-medium text-gray-700">
                  Farm Type *
                </label>
                <select
                  id="farm_type"
                  name="farm_type"
                  required
                  value={formData.farm_type}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  {farmTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="farm_description" className="block text-sm font-medium text-gray-700">
                Farm Description
              </label>
              <textarea
                id="farm_description"
                name="farm_description"
                rows={3}
                value={formData.farm_description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Tell us about your farm..."
              />
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {certificationOptions.map(cert => (
                  <label key={cert.value} className="flex items-center">
                    <input
                      type="checkbox"
                      name="certifications"
                      value={cert.value}
                      checked={formData.certifications.includes(cert.value)}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{cert.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experience and Land */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  id="experience_years"
                  name="experience_years"
                  required
                  min="0"
                  max="100"
                  value={formData.experience_years}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="total_land_area" className="block text-sm font-medium text-gray-700">
                  Total Land Area (acres) *
                </label>
                <input
                  type="number"
                  id="total_land_area"
                  name="total_land_area"
                  required
                  min="0"
                  step="0.1"
                  value={formData.total_land_area}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="employee_count" className="block text-sm font-medium text-gray-700">
                  Number of Employees *
                </label>
                <input
                  type="number"
                  id="employee_count"
                  name="employee_count"
                  required
                  min="1"
                  value={formData.employee_count}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State *
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Detect Location
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="alternate_phone" className="block text-sm font-medium text-gray-700">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  id="alternate_phone"
                  name="alternate_phone"
                  value={formData.alternate_phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={createFarmerMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createFarmerMutation.isPending ? 'Creating Profile...' : 'Complete Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};