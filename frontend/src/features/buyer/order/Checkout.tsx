// features/buyer/orders/Checkout.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOrders } from '../../order/hooks/useOrders';
import type { CreateOrderRequest, PaymentMethod } from '../../order/types/orderTypes';
import { formatCurrency } from '../../order/utils/orderUtils';

// Define proper types for cart items
interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  farmer_id: string;
  farmer_name: string;
  farm_name: string;
  unit_price: number;
  quantity: number;
  unit: string;
  available_stock: number;
  min_order: number;
  organic: boolean;
  quality_grade: string;
}

interface CheckoutProps {}

export const Checkout: React.FC<CheckoutProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { createOrder, loading, error } = useOrders();
  
  // Properly type the cart items from location state
  const cartItems: CartItem[] = location.state?.cartItems || [];
  
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
    
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const orderData: CreateOrderRequest = {
      ...formData,
      items: cartItems.map((item: CartItem) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    const order = await createOrder(orderData);
    if (order) {
      // Clear cart from localStorage
      localStorage.removeItem('buyer_cart');
      
      // Redirect to order confirmation
      navigate('/buyer/orders', { 
        state: { 
          message: `Order #${order.order_number} created successfully!`,
          orderId: order.id 
        }
      });
    }
  };

  const calculateSubtotal = (): number => {
    return cartItems.reduce((total: number, item: CartItem) => 
      total + (item.unit_price * item.quantity), 0
    );
  };

  const calculateTax = (subtotal: number): number => {
    return subtotal * 0.1; // 10% tax
  };

  const calculateShipping = (): number => {
    return 15.00; // Fixed shipping cost
  };

  const calculateTotal = (): number => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const shipping = calculateShipping();
    return subtotal + tax + shipping;
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🛒</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-6">Add some products to proceed to checkout</p>
          <button
            onClick={() => navigate('/buyer/suppliers')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Suppliers
          </button>
        </div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const shipping = calculateShipping();
  const total = calculateTotal();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Shipping and Payment */}
        <div className="space-y-6">
          {/* Shipping Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
            <div className="space-y-4">
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
                  placeholder="Enter your shipping address"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                    placeholder="City"
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
                    placeholder="State"
                  />
                </div>
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
                  placeholder="ZIP Code"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Notes (Optional)
                </label>
                <textarea
                  value={formData.shipping_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipping_notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special delivery instructions..."
                />
              </div>
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
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-4">
              {cartItems.map((item: CartItem) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                    <p className="text-sm text-gray-600">
                      {item.quantity} {item.unit} × {formatCurrency(item.unit_price)}
                    </p>
                    <p className="text-xs text-gray-500">From: {item.farm_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-lg text-gray-900">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary by Supplier */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Suppliers</h3>
            <div className="space-y-3">
              {Array.from(new Set(cartItems.map((item: CartItem) => item.farm_name))).map((farmName: string) => {
                const farmItems = cartItems.filter((item: CartItem) => item.farm_name === farmName);
                const farmTotal = farmItems.reduce((total: number, item: CartItem) => 
                  total + (item.unit_price * item.quantity), 0
                );
                
                return (
                  <div key={farmName} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{farmName}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(farmTotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? 'Creating Order...' : `Place Order - ${formatCurrency(total)}`}
          </button>

          <button
            type="button"
            onClick={() => navigate('/buyer/suppliers')}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;