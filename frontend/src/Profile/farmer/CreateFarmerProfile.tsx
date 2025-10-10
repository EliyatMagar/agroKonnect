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
    country: 'United States',
    zip_code: '',
    latitude: 0,
    longitude: 0,
    alternate_phone: '',
    website: '',
    total_land_area: 0,
    employee_count: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const navigate = useNavigate();
  const createFarmerMutation = useCreateFarmer();

  // Helper functions
  const isValidUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true;
    return /^\+\d{1,15}$/.test(phone);
  };

  const isAtLeast18 = (dateString: string): boolean => {
    const dob = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      return age - 1 >= 18;
    }
    
    return age >= 18;
  };

  // Step validation functions
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Full name is required';
      } else if (formData.full_name.trim().length < 2) {
        newErrors.full_name = 'Full name must be at least 2 characters';
      }

      if (!formData.date_of_birth) {
        newErrors.date_of_birth = 'Date of birth is required';
      } else if (!isAtLeast18(formData.date_of_birth)) {
        newErrors.date_of_birth = 'Must be at least 18 years old';
      }

      if (!formData.farm_name.trim()) {
        newErrors.farm_name = 'Farm name is required';
      } else if (formData.farm_name.trim().length < 2) {
        newErrors.farm_name = 'Farm name must be at least 2 characters';
      }

      if (formData.experience_years < 0) {
        newErrors.experience_years = 'Experience years cannot be negative';
      } else if (formData.experience_years > 100) {
        newErrors.experience_years = 'Please enter a valid number of years';
      }
    }

    if (step === 2) {
      if (!formData.address || formData.address.trim().length < 5) {
        newErrors.address = 'Address must be at least 5 characters long';
      }

      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      }

      if (!formData.state.trim()) {
        newErrors.state = 'State is required';
      }

      if (!formData.country.trim()) {
        newErrors.country = 'Country is required';
      }
    }

    if (step === 3) {
      if (formData.total_land_area < 0) {
        newErrors.total_land_area = 'Land area cannot be negative';
      } else if (formData.total_land_area > 100000) {
        newErrors.total_land_area = 'Please enter a valid land area';
      }

      if (formData.employee_count < 1) {
        newErrors.employee_count = 'Must have at least 1 employee';
      } else if (formData.employee_count > 10000) {
        newErrors.employee_count = 'Please enter a valid number of employees';
      }

      if (formData.alternate_phone && !validatePhoneNumber(formData.alternate_phone)) {
        newErrors.alternate_phone = 'Phone number must be in E.164 format (e.g., +1234567890)';
      }

      if (formData.website && !isValidUrl(formData.website)) {
        newErrors.website = 'Please enter a valid website URL (e.g., https://example.com)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (type === 'number') {
      const numValue = value === '' ? 0 : Number(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
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

  // Handle phone number input with formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Auto-format to E.164 if user starts with +
    let formattedValue = value;
    if (value.startsWith('+')) {
      // Remove any non-digit characters after the +
      formattedValue = '+' + value.slice(1).replace(/\D/g, '');
    } else if (value && !value.startsWith('+')) {
      // Auto-add + if user starts with digits
      formattedValue = '+' + value.replace(/\D/g, '');
    }
    
    setFormData(prev => ({ ...prev, alternate_phone: formattedValue }));
    
    // Clear error
    if (errors.alternate_phone) {
      setErrors(prev => ({ ...prev, alternate_phone: '' }));
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error('Please fix the validation errors before continuing.');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      toast.error('Please fix the validation errors before submitting.');
      return;
    }
    
    // Prepare final data with proper formatting
    const submitData: CreateFarmerRequest = {
      ...formData,
      full_name: formData.full_name.trim(),
      farm_name: formData.farm_name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      country: formData.country.trim(),
      // Ensure optional fields are either properly formatted or undefined
      alternate_phone: formData.alternate_phone?.trim() || undefined,
      website: formData.website?.trim() || undefined,
      zip_code: formData.zip_code?.trim() || undefined,
      farm_description: formData.farm_description?.trim() || undefined,
    };
    
    createFarmerMutation.mutate(submitData, {
      onSuccess: () => {
        toast.success('Farmer profile created successfully!');
        setTimeout(() => {
          navigate('/farmer/dashboard');
        }, 1500);
      },
      onError: (error: any) => {
        const errorMessage = error.message || 'Failed to create farmer profile';
        toast.error(errorMessage);
        
        // Handle specific backend validation errors
        if (errorMessage.toLowerCase().includes('address')) {
          setErrors(prev => ({ ...prev, address: 'Address validation failed. Please provide a complete address.' }));
        }
        if (errorMessage.toLowerCase().includes('phone')) {
          setErrors(prev => ({ ...prev, alternate_phone: 'Phone number must be in E.164 format (e.g., +1234567890)' }));
        }
        if (errorMessage.toLowerCase().includes('website')) {
          setErrors(prev => ({ ...prev, website: 'Please enter a valid website URL' }));
        }
      }
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: parseFloat(position.coords.latitude.toFixed(6)),
            longitude: parseFloat(position.coords.longitude.toFixed(6)),
          }));
          setIsDetectingLocation(false);
          toast.success('Location detected successfully!');
        },
        (error) => {
          setIsDetectingLocation(false);
          let errorMessage = 'Unable to detect location. Please enter manually.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          toast.error(errorMessage);
        },
        {
          timeout: 10000,
          enableHighAccuracy: true
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  // Step 1: Personal & Farm Information
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal & Farm Information</h3>
        <p className="text-sm text-gray-600 mb-6">Tell us about yourself and your farm</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            required
            value={formData.full_name}
            onChange={handleChange}
            maxLength={100}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500 ${
              errors.full_name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            id="date_of_birth"
            name="date_of_birth"
            required
            value={formData.date_of_birth}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500 ${
              errors.date_of_birth ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.date_of_birth && (
            <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Must be at least 18 years old</p>
        </div>

        <div>
          <label htmlFor="farm_name" className="block text-sm font-medium text-gray-700 mb-2">
            Farm Name *
          </label>
          <input
            type="text"
            id="farm_name"
            name="farm_name"
            required
            value={formData.farm_name}
            onChange={handleChange}
            maxLength={100}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500 ${
              errors.farm_name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter your farm name"
          />
          {errors.farm_name && (
            <p className="mt-1 text-sm text-red-600">{errors.farm_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="farm_type" className="block text-sm font-medium text-gray-700 mb-2">
            Farm Type *
          </label>
          <select
            id="farm_type"
            name="farm_type"
            required
            value={formData.farm_type}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
          >
            {farmTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700 mb-2">
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
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500 ${
              errors.experience_years ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.experience_years && (
            <p className="mt-1 text-sm text-red-600">{errors.experience_years}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="farm_description" className="block text-sm font-medium text-gray-700 mb-2">
          Farm Description
        </label>
        <textarea
          id="farm_description"
          name="farm_description"
          rows={4}
          value={formData.farm_description}
          onChange={handleChange}
          maxLength={500}
          className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
          placeholder="Tell us about your farm, products, and farming practices..."
        />
        <p className="mt-1 text-xs text-gray-500">
          {formData.farm_description.length}/500 characters
        </p>
      </div>
    </div>
  );

  // Step 2: Location Information
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Farm Location</h3>
        <p className="text-sm text-gray-600 mb-6">Where is your farm located?</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <input
            type="text"
            id="address"
            name="address"
            required
            value={formData.address}
            onChange={handleChange}
            maxLength={200}
            placeholder="Full street address (minimum 5 characters)"
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500 ${
              errors.address ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              maxLength={50}
              className={`w-full border rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500 ${
                errors.city ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              type="text"
              id="state"
              name="state"
              required
              value={formData.state}
              onChange={handleChange}
              maxLength={50}
              className={`w-full border rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500 ${
                errors.state ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state}</p>
            )}
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Country *
            </label>
            <input
              type="text"
              id="country"
              name="country"
              required
              value={formData.country}
              onChange={handleChange}
              maxLength={50}
              className={`w-full border rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500 ${
                errors.country ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.country && (
              <p className="mt-1 text-sm text-red-600">{errors.country}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              id="zip_code"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleChange}
              maxLength={20}
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., 12345"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isDetectingLocation}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDetectingLocation ? 'Detecting Location...' : 'Detect Location'}
            </button>
          </div>
        </div>

        {formData.latitude !== 0 && formData.longitude !== 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✅ Location detected: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Step 3: Farm Details & Contact
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Farm Details & Contact</h3>
        <p className="text-sm text-gray-600 mb-6">Additional farm information and contact details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="total_land_area" className="block text-sm font-medium text-gray-700 mb-2">
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
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500 ${
              errors.total_land_area ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.total_land_area && (
            <p className="mt-1 text-sm text-red-600">{errors.total_land_area}</p>
          )}
        </div>

        <div>
          <label htmlFor="employee_count" className="block text-sm font-medium text-gray-700 mb-2">
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
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500 ${
              errors.employee_count ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.employee_count && (
            <p className="mt-1 text-sm text-red-600">{errors.employee_count}</p>
          )}
        </div>

        <div>
          <label htmlFor="alternate_phone" className="block text-sm font-medium text-gray-700 mb-2">
            Alternate Phone
          </label>
          <input
            type="tel"
            id="alternate_phone"
            name="alternate_phone"
            value={formData.alternate_phone}
            onChange={handlePhoneChange}
            maxLength={16}
            placeholder="+1234567890 (E.164 format)"
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500 ${
              errors.alternate_phone ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.alternate_phone && (
            <p className="mt-1 text-sm text-red-600">{errors.alternate_phone}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Must be in E.164 format (e.g., +1234567890)
          </p>
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            maxLength={200}
            placeholder="https://example.com"
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500 ${
              errors.website ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.website && (
            <p className="mt-1 text-sm text-red-600">{errors.website}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Include https:// for valid URLs
          </p>
        </div>
      </div>
    </div>
  );

  // Step 4: Certifications
  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Farm Certifications</h3>
        <p className="text-sm text-gray-600 mb-6">Select all certifications that apply to your farm</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certificationOptions.map(cert => (
          <label key={cert.value} className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              name="certifications"
              value={cert.value}
              checked={formData.certifications.includes(cert.value)}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
            />
            <span className="ml-3 text-sm text-gray-700 font-medium">{cert.label}</span>
          </label>
        ))}
      </div>

      {formData.certifications.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            ✅ Selected {formData.certifications.length} certification(s)
          </p>
        </div>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Farmer Profile</h1>
          <p className="text-gray-600">Set up your farm profile to start connecting with buyers</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[...Array(totalSteps)].map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 mx-1 rounded-full ${
                  index + 1 <= currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Personal Info</span>
            <span>Location</span>
            <span>Farm Details</span>
            <span>Certifications</span>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {errors.submit && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={createFarmerMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createFarmerMutation.isPending ? 'Creating Profile...' : 'Complete Profile'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at support@agrokonnect.com
          </p>
        </div>
      </div>
    </div>
  );
};