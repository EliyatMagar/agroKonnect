// components/farmer/ProductManagement.tsx - UPDATED
import React, { useState, useEffect } from 'react';
import { useProducts, useProductImages } from '../../product/hooks/productHooks';
import type { ProductResponse, ProductStatus } from '../../product/types/productTypes';
import { ProductForm } from './ProductForm';
import { ProductList } from './ProductList';
import { ProductStats } from './ProductStats';

export const ProductManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  
  const { 
    getMyProducts, 
    deleteProduct, 
    updateStatus,
    updateStock,
    loading, 
    error 
  } = useProducts();
  
  const [products, setProducts] = useState<ProductResponse[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const myProducts = await getMyProducts();
    if (myProducts) {
      setProducts(myProducts);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setActiveTab('create');
  };

  const handleEditProduct = (product: ProductResponse) => {
    setEditingProduct(product);
    setActiveTab('edit');
  };

  const handleDeleteProduct = async (productId: string) => {
    const success = await deleteProduct(productId);
    if (success) {
      setProducts(products.filter(p => p.id !== productId));
      setShowDeleteModal(null);
    }
  };

  const handleUpdateStatus = async (productId: string, status: ProductStatus) => {
    const success = await updateStatus(productId, status);
    if (success) {
      setProducts(products.map(p => 
        p.id === productId ? { ...p, status } : p
      ));
    }
  };

  const handleUpdateStock = async (productId: string, quantity: number) => {
    const success = await updateStock(productId, quantity);
    if (success) {
      setProducts(products.map(p => 
        p.id === productId ? { ...p, available_stock: quantity } : p
      ));
    }
  };

  const handleFormSuccess = () => {
    setActiveTab('list');
    loadProducts();
  };

  const handleCancel = () => {
    setActiveTab('list');
    setEditingProduct(null);
  };

  if (activeTab === 'create' || activeTab === 'edit') {
    return (
      <ProductForm
        product={editingProduct}
        mode={activeTab === 'create' ? 'create' : 'edit'}
        onSuccess={handleFormSuccess}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
        <button
          onClick={handleCreateProduct}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Add New Product
        </button>
      </div>

      <ProductStats products={products} />

      <ProductList
        products={products}
        loading={loading}
        onEdit={handleEditProduct}
        onDelete={(id) => setShowDeleteModal(id)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateStock={handleUpdateStock}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(showDeleteModal)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};