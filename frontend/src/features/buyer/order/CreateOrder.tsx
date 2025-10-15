// features/buyer/orders/CreateOrder.tsx
import React, { useState } from 'react';
import { useOrders } from '../../order/hooks/useOrders';
import type { CreateOrderRequest, PaymentMethod } from '../../order/types/orderTypes';
import { validateOrderForm, formatCurrency } from '../../order/utils/orderUtils';

interface CreateOrderProps {
  cartItems: any[]; // You'll need to define your cart item type
  onOrderCreated: (orderId: string) => void;
  onCancel: () => void;
}

export const CreateOrder: React.FC<CreateOrderProps> = ({ 
  cartItems, 
  onOrderCreated, 
  onCancel 
}) => {
  const { createOrder, loading, error } = useOrders();
  const [formData, setFormData] = useState({
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip_code: '',
    shipping_notes: '',
    payment_method: 'credit_card' as PaymentMethod,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateOrderForm({ ...formData, items: cartItems });
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const orderData: CreateOrderRequest = {
      ...formData,
      items: cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    const order = await createOrder(orderData);
    if (order) {
      onOrderCreated(order.id);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create Order</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shipping Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                required
                value={formData.shipping_address}
                onChange={(e) => setFormData(prev => ({ ...prev, shipping_address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                required
                value={formData.shipping_city}
                onChange={(e) => setFormData(prev => ({ ...prev, shipping_city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                required
                value={formData.shipping_state}
                onChange={(e) => setFormData(prev => ({ ...prev, shipping_state: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                required
                value={formData.shipping_zip_code}
                onChange={(e) => setFormData(prev => ({ ...prev, shipping_zip_code: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Notes (Optional)
            </label>
            <textarea
              value={formData.shipping_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, shipping_notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
          <select
            value={formData.payment_method}
            onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as PaymentMethod }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="credit_card">Credit Card</option>
            <option value="digital_wallet">Digital Wallet</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="upi">UPI</option>
            <option value="cash_on_delivery">Cash on Delivery</option>
          </select>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2">
            {cartItems.map((item) => (
              <div key={item.product_id} className="flex justify-between items-center">
                <span>{item.product_name} x {item.quantity}</span>
                <span>{formatCurrency(item.unit_price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-2 font-semibold">
              <div className="flex justify-between">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Order...' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
};