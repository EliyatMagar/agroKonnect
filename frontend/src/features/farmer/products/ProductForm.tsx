// components/farmer/ProductForm.tsx - UPDATED
import React, { useState } from 'react';
import { useProducts, useProductImages } from '../../product/hooks/useProducts';
import type { 
  ProductResponse, 
  CreateProductRequest, 
  UpdateProductRequest,
  ProductFormData,
  ProductFormSubmission
} from '../../product/types/productTypes';
import { 
  productCategories, 
  qualityGrades, 
  units, 
  validateProductForm 
} from '../../product/utils/productUtils';

interface ProductFormProps {
  product?: ProductResponse | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  mode,
  onSuccess,
  onCancel
}) => {
  const { createProduct, updateProduct, loading } = useProducts();
  const { uploadMultipleImages, uploading } = useProductImages();

  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    category: product?.category || 'vegetables',
    subcategory: product?.subcategory || '',
    description: product?.description || '',
    images: product?.images || [], // Start with string URLs for existing products
    price_per_unit: product?.price_per_unit || 0,
    unit: product?.unit || 'kg',
    available_stock: product?.available_stock || 0,
    min_order: product?.min_order || 1,
    max_order: product?.max_order || 100,
    quality_grade: product?.quality_grade || 'standard',
    organic: product?.organic || false,
    certified: product?.certified || false,
    certification_details: product?.certification_details || '',
    harvest_date: product?.harvest_date || '',
    shelf_life: product?.shelf_life || 7,
    storage_tips: product?.storage_tips || '',
    weight_range: product?.weight_range || '',
    color: product?.color || '',
    size: product?.size || '',
    variety: product?.variety || '',
    farm_location: product?.farm_location || '',
    latitude: product?.latitude || 0,
    longitude: product?.longitude || 0,
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>(product?.images || []);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      // Create local previews
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
      setNewImageFiles(prev => [...prev, ...files]);
      
      // Add files to form data for validation
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...files]
      }));
    } catch (error) {
      console.error('Failed to process images:', error);
    }
  };

  const removeImage = (index: number) => {
    const updatedPreviews = [...imagePreviews];
    const removedPreview = updatedPreviews.splice(index, 1)[0];
    
    // Revoke object URL if it's a new file
    if (removedPreview.startsWith('blob:')) {
      URL.revokeObjectURL(removedPreview);
    }
    
    setImagePreviews(updatedPreviews);
    
    // Update new files array
    const updatedFiles = [...newImageFiles];
    updatedFiles.splice(index - (imagePreviews.length - newImageFiles.length), 1);
    setNewImageFiles(updatedFiles);
    
    // Update form data
    const currentImages = [...formData.images];
    currentImages.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      images: currentImages
    }));
  };

  const prepareSubmissionData = async (): Promise<CreateProductRequest | UpdateProductRequest> => {
    // Upload new images first
    let imageUrls: string[] = [];
    
    if (newImageFiles.length > 0) {
      imageUrls = await uploadMultipleImages(newImageFiles);
    }

    // Combine existing image URLs with new ones
    const existingImageUrls = formData.images.filter(img => typeof img === 'string') as string[];
    const allImageUrls = [...existingImageUrls, ...imageUrls];

    // Create the submission data
    const submissionData = {
      name: formData.name,
      category: formData.category,
      subcategory: formData.subcategory,
      description: formData.description,
      images: allImageUrls,
      price_per_unit: formData.price_per_unit,
      unit: formData.unit,
      available_stock: formData.available_stock,
      min_order: formData.min_order,
      max_order: formData.max_order,
      quality_grade: formData.quality_grade,
      organic: formData.organic,
      certified: formData.certified,
      certification_details: formData.certification_details,
      harvest_date: formData.harvest_date,
      shelf_life: formData.shelf_life,
      storage_tips: formData.storage_tips,
      weight_range: formData.weight_range,
      color: formData.color,
      size: formData.size,
      variety: formData.variety,
      farm_location: formData.farm_location,
      latitude: formData.latitude,
      longitude: formData.longitude,
    };

    return submissionData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateProductForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);

    try {
      const submissionData = await prepareSubmissionData();

      if (mode === 'create') {
        await createProduct(submissionData as CreateProductRequest);
      } else if (product) {
        await updateProduct(product.id, submissionData as UpdateProductRequest);
      }
      onSuccess();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Operation failed']);
    }
  };

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [imagePreviews]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add New Product' : 'Edit Product'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <ul className="list-disc list-inside text-red-800">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Rest of the form remains the same */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {productCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Add the missing fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variety
              </label>
              <input
                type="text"
                name="variety"
                value={formData.variety}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Small, Medium, Large"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Red, Green, Yellow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight Range
              </label>
              <input
                type="text"
                name="weight_range"
                value={formData.weight_range}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 100-150g per piece"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Unit *
              </label>
              <input
                type="number"
                name="price_per_unit"
                value={formData.price_per_unit}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Stock *
              </label>
              <input
                type="number"
                name="available_stock"
                value={formData.available_stock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Grade
              </label>
              <select
                name="quality_grade"
                value={formData.quality_grade}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {qualityGrades.map(grade => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Order Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Order *
              </label>
              <input
                type="number"
                name="min_order"
                value={formData.min_order}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Order
              </label>
              <input
                type="number"
                name="max_order"
                value={formData.max_order}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Harvest Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harvest Date *
              </label>
              <input
                type="date"
                name="harvest_date"
                value={formData.harvest_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shelf Life (days) *
              </label>
              <input
                type="number"
                name="shelf_life"
                value={formData.shelf_life}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Farm Location *
              </label>
              <input
                type="text"
                name="farm_location"
                value={formData.farm_location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                placeholder="Enter your farm address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 40.7128"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="organic"
                  checked={formData.organic}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Organic</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="certified"
                  checked={formData.certified}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Certified</span>
              </label>
            </div>

            {formData.certified && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certification Details
                </label>
                <input
                  type="text"
                  name="certification_details"
                  value={formData.certification_details}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., USDA Organic, GlobalG.A.P."
                />
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            
            {uploading && (
              <p className="text-sm text-gray-600 mt-2">Uploading images...</p>
            )}

            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Storage Tips */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Storage Tips
            </label>
            <textarea
              name="storage_tips"
              value={formData.storage_tips}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Share best practices for storing your product..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading || uploading ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};