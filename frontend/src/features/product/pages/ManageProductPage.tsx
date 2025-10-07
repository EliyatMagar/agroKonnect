// pages/ManageProductPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts, useProductImages } from '../hooks/useProducts';
import type { CreateProductRequest, UpdateProductRequest, ProductFormData } from '../types/productTypes';
import { productCategories, qualityGrades, units, validateProductForm } from '../utils/productUtils';

const ManageProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createProduct, getProduct, updateProduct, loading, error } = useProducts();
  const { uploadMultipleImages, uploading } = useProductImages();
  
  const [formData, setFormData] = useState<Partial<CreateProductRequest>>({
    name: '',
    category: 'vegetables',
    subcategory: '',
    description: '',
    images: [],
    price_per_unit: 0,
    unit: 'kg',
    available_stock: 0,
    min_order: 1,
    max_order: 0,
    quality_grade: 'standard',
    organic: false,
    certified: false,
    certification_details: '',
    harvest_date: '',
    shelf_life: 7,
    storage_tips: '',
    weight_range: '',
    color: '',
    size: '',
    variety: '',
    farm_location: '',
    latitude: 0,
    longitude: 0,
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const isEditing = Boolean(id);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    const product = await getProduct(id!);
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        description: product.description,
        images: product.images,
        price_per_unit: product.price_per_unit,
        unit: product.unit,
        available_stock: product.available_stock,
        min_order: product.min_order,
        max_order: product.max_order,
        quality_grade: product.quality_grade,
        organic: product.organic,
        certified: product.certified,
        certification_details: product.certification_details,
        harvest_date: product.harvest_date,
        shelf_life: product.shelf_life,
        storage_tips: product.storage_tips,
        weight_range: product.weight_range || '',
        color: product.color || '',
        size: product.size || '',
        variety: product.variety || '',
        farm_location: product.farm_location,
        latitude: product.latitude || 0,
        longitude: product.longitude || 0,
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (files: FileList) => {
    const newFiles = Array.from(files);
    setImageFiles(prev => [...prev, ...newFiles]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateProductForm(formData);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors([]);

    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadMultipleImages(imageFiles);
      }

      const submitData = {
        ...formData,
        images: [...(formData.images || []), ...imageUrls],
      } as CreateProductRequest;

      if (isEditing) {
        await updateProduct(id!, submitData as UpdateProductRequest);
      } else {
        await createProduct(submitData);
      }

      navigate('/my-products');
    } catch (err) {
      console.error('Failed to save product:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {formErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <ul className="list-disc list-inside">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                >
                  {productCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <input
                  type="text"
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="variety" className="block text-sm font-medium text-gray-700 mb-2">
                  Variety
                </label>
                <input
                  type="text"
                  id="variety"
                  name="variety"
                  value={formData.variety}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </section>

          {/* Pricing & Stock */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing & Stock</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="price_per_unit" className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Unit *
                </label>
                <input
                  type="number"
                  id="price_per_unit"
                  name="price_per_unit"
                  value={formData.price_per_unit}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="available_stock" className="block text-sm font-medium text-gray-700 mb-2">
                  Available Stock *
                </label>
                <input
                  type="number"
                  id="available_stock"
                  name="available_stock"
                  value={formData.available_stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="min_order" className="block text-sm font-medium text-gray-700 mb-2">
                  Min Order *
                </label>
                <input
                  type="number"
                  id="min_order"
                  name="min_order"
                  value={formData.min_order}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </section>

          {/* Quality Information */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quality Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quality_grade" className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Grade
                </label>
                <select
                  id="quality_grade"
                  name="quality_grade"
                  value={formData.quality_grade}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                >
                  {qualityGrades.map(grade => (
                    <option key={grade.value} value={grade.value}>{grade.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="organic"
                    name="organic"
                    checked={formData.organic}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="organic" className="ml-2 block text-sm text-gray-900">
                    Organic
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="certified"
                    name="certified"
                    checked={formData.certified}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="certified" className="ml-2 block text-sm text-gray-900">
                    Certified
                  </label>
                </div>
              </div>
            </div>

            {formData.certified && (
              <div className="mt-4">
                <label htmlFor="certification_details" className="block text-sm font-medium text-gray-700 mb-2">
                  Certification Details
                </label>
                <input
                  type="text"
                  id="certification_details"
                  name="certification_details"
                  value={formData.certification_details}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}
          </section>

          {/* Harvest Information */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Harvest Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="harvest_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Harvest Date *
                </label>
                <input
                  type="date"
                  id="harvest_date"
                  name="harvest_date"
                  value={formData.harvest_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="shelf_life" className="block text-sm font-medium text-gray-700 mb-2">
                  Shelf Life (days) *
                </label>
                <input
                  type="number"
                  id="shelf_life"
                  name="shelf_life"
                  value={formData.shelf_life}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="storage_tips" className="block text-sm font-medium text-gray-700 mb-2">
                Storage Tips
              </label>
              <textarea
                id="storage_tips"
                name="storage_tips"
                value={formData.storage_tips}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="Share tips for storing this product to maintain freshness..."
              />
            </div>
          </section>

          {/* Product Images */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Images</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Preview Images */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imageFiles.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
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
          </section>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/my-products')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading || uploading ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageProductPage;