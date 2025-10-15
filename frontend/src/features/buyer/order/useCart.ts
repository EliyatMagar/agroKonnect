// hooks/useCart.ts
import { useState, useEffect, useCallback } from 'react';
import type { ProductResponse } from '../../product/types/productTypes';

export interface CartItem {
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

interface CartOperationResult {
  success: boolean;
  message: string;
}

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartQuantities, setCartQuantities] = useState<{ [key: string]: number }>({});

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('buyer_cart');
    if (savedCart) {
      try {
        const parsedCart: CartItem[] = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('buyer_cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem('buyer_cart', JSON.stringify(cart));
      
      // Sync quantities
      const quantities: { [key: string]: number } = {};
      cart.forEach((item: CartItem) => {
        quantities[item.product_id] = item.quantity;
      });
      setCartQuantities(quantities);
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = useCallback((product: ProductResponse): CartOperationResult => {
    try {
      const existingItem = cart.find(item => item.product_id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        if (newQuantity > product.available_stock) {
          return {
            success: false,
            message: `Cannot add more than available stock (${product.available_stock})`
          };
        }
        
        setCart(prev => prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        ));
      } else {
        const quantity = Math.max(1, product.min_order);
        if (quantity > product.available_stock) {
          return {
            success: false,
            message: `Requested quantity exceeds available stock (${product.available_stock})`
          };
        }
        
        const cartItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product_id: product.id,
          product_name: product.name,
          product_image: product.images?.[0] || '',
          farmer_id: product.farmer_id,
          farmer_name: product.farmer_name,
          farm_name: product.farm_name,
          unit_price: product.price_per_unit,
          quantity: quantity,
          unit: product.unit,
          available_stock: product.available_stock,
          min_order: product.min_order,
          organic: product.organic || false,
          quality_grade: product.quality_grade || 'standard'
        };
        
        setCart(prev => [...prev, cartItem]);
      }
      
      return {
        success: true,
        message: `${product.name} added to cart!`
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return {
        success: false,
        message: 'Failed to add item to cart'
      };
    }
  }, [cart]);

  const updateCartQuantity = useCallback((productId: string, newQuantity: number): CartOperationResult => {
    try {
      const cartItem = cart.find(item => item.product_id === productId);
      if (!cartItem) {
        return {
          success: false,
          message: 'Item not found in cart'
        };
      }

      if (newQuantity < cartItem.min_order) {
        return {
          success: false,
          message: `Minimum order quantity is ${cartItem.min_order}`
        };
      }

      if (newQuantity > cartItem.available_stock) {
        return {
          success: false,
          message: `Cannot order more than available stock (${cartItem.available_stock})`
        };
      }

      setCart(prev => prev.map(item =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
      
      return {
        success: true,
        message: 'Quantity updated successfully'
      };
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      return {
        success: false,
        message: 'Failed to update quantity'
      };
    }
  }, [cart]);

  const removeFromCart = useCallback((productId: string): CartOperationResult => {
    try {
      setCart(prev => prev.filter(item => item.product_id !== productId));
      return {
        success: true,
        message: 'Item removed from cart'
      };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return {
        success: false,
        message: 'Failed to remove item from cart'
      };
    }
  }, []);

  const clearCart = useCallback((): CartOperationResult => {
    try {
      setCart([]);
      return {
        success: true,
        message: 'Cart cleared successfully'
      };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return {
        success: false,
        message: 'Failed to clear cart'
      };
    }
  }, []);

  const getCartTotal = useCallback((): number => {
    return cart.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  }, [cart]);

  const getCartItemCount = useCallback((): number => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const getCartItem = useCallback((productId: string): CartItem | undefined => {
    return cart.find(item => item.product_id === productId);
  }, [cart]);

  return {
    cart,
    cartQuantities,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    getCartItem
  };
};