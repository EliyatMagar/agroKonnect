// components/farmer/ProductStats.tsx
import React from 'react';
import type { ProductResponse } from '../../product/types/productTypes';

interface ProductStatsProps {
  products: ProductResponse[];
}

export const ProductStats: React.FC<ProductStatsProps> = ({ products }) => {
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    soldOut: products.filter(p => p.status === 'sold_out').length,
    draft: products.filter(p => p.status === 'draft').length,
    totalRevenue: products.reduce((sum, product) => 
      sum + (product.price_per_unit * product.available_stock), 0
    ),
    lowStock: products.filter(p => p.available_stock < 10).length,
  };

  const statCards = [
    {
      label: 'Total Products',
      value: stats.total,
      color: 'bg-blue-500',
      icon: '📦'
    },
    {
      label: 'Active Products',
      value: stats.active,
      color: 'bg-green-500',
      icon: '✅'
    },
    {
      label: 'Sold Out',
      value: stats.soldOut,
      color: 'bg-red-500',
      icon: '⏸️'
    },
    {
      label: 'Low Stock',
      value: stats.lowStock,
      color: 'bg-yellow-500',
      icon: '⚠️'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">{stat.icon}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.label}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};