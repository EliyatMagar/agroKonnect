import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateBuyer } from '../../features/buyer/hooks/useBuyer';
import type { CreateBuyerRequest } from '../../features/buyer/types/buyerTypes';
import { 
  buyerTypeLabels, 
  businessScaleLabels, 
  commonProducts, 
  qualityStandards,
  validateYearEstablished,
  validateMonthlyVolume,
  validateEmployeeCount
} from '../../features/buyer/utils/buyerUtils';

export const CreateBuyerProfile: React.FC = () => {
  const navigate = useNavigate();
  const createBuyerMutation = useCreateBuyer();
  
  const [formData, setFormData] = useState<CreateBuyerRequest>({
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year_established' || name === 'employee_count' || name === 'monthly_volume' 
        ? Number(value) 
        : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayChange = (field: 'preferred_products' | 'quality_standards', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.business_name.trim()) {
        newErrors.business_name = 'Business name is required';
      }
      if (!formData.contact_person.trim()) {
        newErrors.contact_person = 'Contact person is required';
      }
      if (!formData.business_license.trim()) {
        newErrors.business_license = 'Business license is required';
      }
      if (!validateYearEstablished(formData.year_established)) {
        newErrors.year_established = 'Year established must be valid';
      }
      if (!validateEmployeeCount(formData.employee_count)) {
        newErrors.employee_count = 'Employee count cannot be negative';
      }
    }

    if (step === 2) {
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
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
      if (!validateMonthlyVolume(formData.monthly_volume)) {
        newErrors.monthly_volume = 'Monthly volume cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateStep(currentStep)) {
      createBuyerMutation.mutate(formData, {
        onSuccess: () => {
          navigate('/buyer/dashboard');
        },
        onError: (error: any) => {
          setErrors({ submit: error.message || 'Failed to create buyer profile' });
        }
      });
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
        <p className="text-sm text-gray-600 mb-6">Tell us about your business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            id="business_name"
            name="business_name"
            value={formData.business_name}
            onChange={handleInputChange}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 ${
              errors.business_name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter your business name"
          />
          {errors.business_name && (
            <p className="mt-1 text-sm text-red-600">{errors.business_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="business_type" className="block text-sm font-medium text-gray-700 mb-2">
            Business Type *
          </label>
          <select
            id="business_type"
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
          <label htmlFor="business_scale" className="block text-sm font-medium text-gray-700 mb-2">
            Business Scale *
          </label>
          <select
            id="business_scale"
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
          <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-2">
            Contact Person *
          </label>
          <input
            type="text"
            id="contact_person"
            name="contact_person"
            value={formData.contact_person}
            onChange={handleInputChange}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 ${
              errors.contact_person ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Full name of contact person"
          />
          {errors.contact_person && (
            <p className="mt-1 text-sm text-red-600">{errors.contact_person}</p>
          )}
        </div>

        <div>
          <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
            Designation
          </label>
          <input
            type="text"
            id="designation"
            name="designation"
            value={formData.designation}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Procurement Manager"
          />
        </div>

        <div>
          <label htmlFor="year_established" className="block text-sm font-medium text-gray-700 mb-2">
            Year Established *
          </label>
          <input
            type="number"
            id="year_established"
            name="year_established"
            value={formData.year_established}
            onChange={handleInputChange}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 ${
              errors.year_established ? 'border-red-300' : 'border-gray-300'
            }`}
            min="1900"
            max={new Date().getFullYear()}
          />
          {errors.year_established && (
            <p className="mt-1 text-sm text-red-600">{errors.year_established}</p>
          )}
        </div>

        <div>
          <label htmlFor="employee_count" className="block text-sm font-medium text-gray-700 mb-2">
            Employee Count *
          </label>
          <input
            type="number"
            id="employee_count"
            name="employee_count"
            value={formData.employee_count}
            onChange={handleInputChange}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 ${
              errors.employee_count ? 'border-red-300' : 'border-gray-300'
            }`}
            min="0"
          />
          {errors.employee_count && (
            <p className="mt-1 text-sm text-red-600">{errors.employee_count}</p>
          )}
        </div>

        <div>
          <label htmlFor="business_license" className="block text-sm font-medium text-gray-700 mb-2">
            Business License Number *
          </label>
          <input
            type="text"
            id="business_license"
            name="business_license"
            value={formData.business_license}
            onChange={handleInputChange}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 ${
              errors.business_license ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter business license number"
          />
          {errors.business_license && (
            <p className="mt-1 text-sm text-red-600">{errors.business_license}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Business Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your business, products, and services..."
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
        <p className="text-sm text-gray-600 mb-6">Where can suppliers reach you?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Business Address *
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 ${
              errors.address ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Street address"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 ${
              errors.city ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="City"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
          )}
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
            State/Province *
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 ${
              errors.state ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="State or province"
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
            value={formData.country}
            onChange={handleInputChange}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 ${
              errors.country ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Country"
          />
          {errors.country && (
            <p className="mt-1 text-sm text-red-600">{errors.country}</p>
          )}
        </div>

        <div>
          <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
            ZIP/Postal Code
          </label>
          <input
            type="text"
            id="zip_code"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ZIP or postal code"
          />
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
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+1 (555) 123-4567"
          />
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
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700 mb-2">
            Tax ID
          </label>
          <input
            type="text"
            id="tax_id"
            name="tax_id"
            value={formData.tax_id}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tax identification number"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Requirements</h3>
        <p className="text-sm text-gray-600 mb-6">What are your purchasing needs?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="monthly_volume" className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Monthly Purchase Volume (USD) *
          </label>
          <input
            type="number"
            id="monthly_volume"
            name="monthly_volume"
            value={formData.monthly_volume}
            onChange={handleInputChange}
            className={`w-full border rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 ${
              errors.monthly_volume ? 'border-red-300' : 'border-gray-300'
            }`}
            min="0"
            step="1000"
            placeholder="0"
          />
          {errors.monthly_volume && (
            <p className="mt-1 text-sm text-red-600">{errors.monthly_volume}</p>
          )}
        </div>
      </div>

      {/* Preferred Products */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Preferred Products *
        </label>
        <p className="text-sm text-gray-600 mb-3">Select the types of products you typically purchase:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
          {commonProducts.map(product => (
            <label key={product} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={formData.preferred_products.includes(product)}
                onChange={(e) => handleArrayChange('preferred_products', product, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{product}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Quality Standards */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Quality Standards
        </label>
        <p className="text-sm text-gray-600 mb-3">Select the quality standards you require:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
          {qualityStandards.map(standard => (
            <label key={standard} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={formData.quality_standards.includes(standard)}
                onChange={(e) => handleArrayChange('quality_standards', standard, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{standard}</span>
            </label>
          ))}
        </div>
      </div>
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Buyer Profile</h1>
          <p className="text-gray-600">Set up your business profile to start sourcing from farmers and suppliers</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[...Array(totalSteps)].map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 mx-1 rounded-full ${
                  index + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Business Info</span>
            <span>Contact Details</span>
            <span>Requirements</span>
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={createBuyerMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createBuyerMutation.isPending ? 'Creating Profile...' : 'Complete Profile'}
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