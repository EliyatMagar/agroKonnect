// components/farmer/ProductList.tsx - UPDATED
import React, { useState } from 'react';
import type { ProductResponse, ProductStatus } from '../../product/types/productTypes';
import { formatPrice, getCategoryIcon, productStatuses } from '../../product/utils/productUtils';

interface ProductListProps {
  products: ProductResponse[];
  loading: boolean;
  onEdit: (product: ProductResponse) => void;
  onDelete: (productId: string) => void;
  onUpdateStatus: (productId: string, status: ProductStatus) => void;
  onUpdateStock: (productId: string, quantity: number) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  loading,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateStock
}) => {
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});
  const [showStockInput, setShowStockInput] = useState<string | null>(null);

  const handleStockUpdate = (productId: string, newQuantity: number) => {
    onUpdateStock(productId, newQuantity);
    setShowStockInput(null);
    setStockUpdates(prev => ({ ...prev, [productId]: 0 }));
  };

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'sold_out': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (productId: string, value: string) => {
    // Type assertion to ensure we're passing a valid ProductStatus
    onUpdateStatus(productId, value as ProductStatus);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
        <p className="text-gray-500 mb-4">Start by adding your first farm product</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {products.map((product) => (
          <li key={product.id}>
            <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">{getCategoryIcon(product.category)}</span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {getCategoryIcon(product.category)} {product.category}
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatPrice(product.price_per_unit)}/{product.unit}</span>
                      <span>•</span>
                      <span>Stock: {product.available_stock}</span>
                      <span>•</span>
                      <span>Min order: {product.min_order}</span>
                    </div>

                    <div className="mt-1 flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {productStatuses.find(s => s.value === product.status)?.label || product.status}
                      </span>
                      {product.organic && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Organic
                        </span>
                      )}
                      {product.certified && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Certified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Stock Update */}
                  <div className="relative">
                    {showStockInput === product.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={stockUpdates[product.id] || product.available_stock}
                          onChange={(e) => setStockUpdates(prev => ({
                            ...prev,
                            [product.id]: parseInt(e.target.value) || 0
                          }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="0"
                        />
                        <button
                          onClick={() => handleStockUpdate(
                            product.id, 
                            stockUpdates[product.id] || product.available_stock
                          )}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setShowStockInput(null)}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowStockInput(product.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Update Stock
                      </button>
                    )}
                  </div>

                  {/* Status Update */}
                  <select
                    value={product.status}
                    onChange={(e) => handleStatusChange(product.id, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {productStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>

                  {/* Actions */}
                  <button
                    onClick={() => onEdit(product)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => onDelete(product.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};