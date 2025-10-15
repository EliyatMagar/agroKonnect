// features/buyer/pages/Suppliers.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../product/hooks/productHooks';
import type { ProductResponse, ProductCategory } from '../../product/types/productTypes';
import { productCategories, getCategoryIcon } from '../../product/utils/productUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Types for location data
interface LocationInfo {
  district?: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Cart item type
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

export const Suppliers: React.FC = () => {
  const { getAllProducts, loading, error } = useProducts();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartQuantities, setCartQuantities] = useState<{ [key: string]: number }>({});
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  
  // Location and distance filters
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(100); // km
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [districts, setDistricts] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Load cart from localStorage on component mount - FIXED VERSION
  useEffect(() => {
    const savedCart = localStorage.getItem('buyer_cart');
    if (savedCart) {
      try {
        const parsedCart: CartItem[] = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('buyer_cart');
        toast.error('Error loading cart data');
      }
    }
    setIsCartLoaded(true);
  }, []); // Empty dependency array - runs only on mount

  // Save cart to localStorage whenever cart changes - FIXED VERSION
  useEffect(() => {
    if (isCartLoaded) {
      try {
        localStorage.setItem('buyer_cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
        toast.error('Error saving cart data');
      }
    }
  }, [cart, isCartLoaded]); // Runs whenever cart changes and cart is loaded

  // Sync cartQuantities with cart whenever cart changes
  useEffect(() => {
    const quantities: { [key: string]: number } = {};
    cart.forEach((item: CartItem) => {
      quantities[item.product_id] = item.quantity;
    });
    setCartQuantities(quantities);
  }, [cart]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, priceRange, searchQuery, maxDistance, selectedDistrict, selectedCity, userLocation]);

  // Cart management functions
  const addToCart = (product: ProductResponse) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      // Update quantity if item already in cart
      const newQuantity = existingItem.quantity + 1;
      if (newQuantity > product.available_stock) {
        toast.error(`Cannot add more than available stock (${product.available_stock})`);
        return;
      }
      
      setCart(prev => prev.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: newQuantity }
          : item
      ));
      toast.success(`Updated ${product.name} quantity to ${newQuantity}`);
    } else {
      // Add new item to cart
      const quantity = Math.max(1, product.min_order);
      if (quantity > product.available_stock) {
        toast.error(`Requested quantity exceeds available stock (${product.available_stock})`);
        return;
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
      toast.success(`${product.name} added to cart!`);
    }
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    const cartItem = cart.find(item => item.product_id === productId);
    if (!cartItem) return;

    if (newQuantity < cartItem.min_order) {
      toast.error(`Minimum order quantity is ${cartItem.min_order}`);
      return;
    }

    if (newQuantity > cartItem.available_stock) {
      toast.error(`Cannot order more than available stock (${cartItem.available_stock})`);
      return;
    }

    setCart(prev => prev.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
    
    if (newQuantity === 0) {
      toast.info(`${cartItem.product_name} removed from cart`);
    } else {
      toast.info(`Updated ${cartItem.product_name} quantity to ${newQuantity}`);
    }
  };

  const removeFromCart = (productId: string) => {
    const cartItem = cart.find(item => item.product_id === productId);
    setCart(prev => prev.filter(item => item.product_id !== productId));
    
    if (cartItem) {
      toast.info(`${cartItem.product_name} removed from cart`);
    }
  };

  const clearCart = () => {
    if (cart.length === 0) {
      toast.info('Cart is already empty');
      return;
    }
    setCart([]);
    toast.info('Cart cleared successfully');
  };

  const getCartTotal = (): number => {
    return cart.reduce((total: number, item: CartItem) => total + (item.unit_price * item.quantity), 0);
  };

  const getCartItemCount = (): number => {
    return cart.reduce((count: number, item: CartItem) => count + item.quantity, 0);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setShowCartModal(false);
    navigate('/buyer/checkout', { state: { cartItems: cart } });
  };

  // Rest of your existing functions
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsGettingLocation(false);
        setLocationError(null);
        toast.success('Location detected successfully!');
      },
      (error) => {
        console.log('Geolocation error:', error);
        setIsGettingLocation(false);
        
        let errorMessage = 'An unknown error occurred while getting location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions to see nearby suppliers.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
            break;
        }
        
        setLocationError(errorMessage);
        toast.error(errorMessage);
        setUserLocation({ lat: 40.7128, lng: -74.0060 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const parseLocation = (locationString: string): LocationInfo => {
    const parts = locationString.split(',').map(part => part.trim());
    
    if (parts.length === 3) {
      return {
        city: parts[0],
        district: parts[1],
        state: parts[1],
        country: parts[2]
      };
    } else if (parts.length === 2) {
      return {
        city: parts[0],
        district: parts[1],
        state: parts[1],
        country: 'Nepal'
      };
    }
    
    return {
      city: locationString,
      district: locationString,
      state: locationString,
      country: 'Nepal'
    };
  };

  const loadProducts = async () => {
    try {
      const response = await getAllProducts({
        page: 1,
        page_size: 100
      });
      
      if (response?.products) {
        const activeProducts = response.products.filter(product => 
          product.status === 'active'
        );
        
        const uniqueDistricts = new Set<string>();
        const uniqueCities = new Set<string>();
        
        activeProducts.forEach(product => {
          const locationInfo = parseLocation(product.farm_location);
          if (locationInfo.district) uniqueDistricts.add(locationInfo.district);
          if (locationInfo.city) uniqueCities.add(locationInfo.city);
        });
        
        setDistricts(Array.from(uniqueDistricts).sort());
        setCities(Array.from(uniqueCities).sort());
        setProducts(activeProducts);
        toast.success(`Loaded ${activeProducts.length} products from ${Array.from(uniqueDistricts).length} districts`);
      }
    } catch (err) {
      toast.error('Failed to load products');
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    filtered = filtered.filter(product => 
      product.price_per_unit >= priceRange[0] && 
      product.price_per_unit <= priceRange[1]
    );

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.farm_name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.farm_location.toLowerCase().includes(query)
      );
    }

    if (selectedDistrict !== 'all') {
      filtered = filtered.filter(product => {
        const locationInfo = parseLocation(product.farm_location);
        return locationInfo.district === selectedDistrict;
      });
    }

    if (selectedCity !== 'all') {
      filtered = filtered.filter(product => {
        const locationInfo = parseLocation(product.farm_location);
        return locationInfo.city === selectedCity;
      });
    }

    if (userLocation && maxDistance < 1000) {
      filtered = filtered.filter(product => {
        if (product.latitude && product.longitude) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            product.latitude,
            product.longitude
          );
          return distance <= maxDistance;
        }
        return true;
      });
    }

    if (userLocation) {
      filtered.sort((a, b) => {
        const distA = a.latitude && a.longitude 
          ? calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
          : Infinity;
        const distB = b.latitude && b.longitude
          ? calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
          : Infinity;
        return distA - distB;
      });
    }

    setFilteredProducts(filtered);
  };

  const handleViewDetails = (product: ProductResponse) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleContactSupplier = (product: ProductResponse, supplier: any) => {
    setSelectedProduct(product);
    setSelectedSupplier(supplier);
    setContactMessage(`Hello ${supplier.farm_name}, I'm interested in your product "${product.name}". Could you provide more information?`);
    setShowContactModal(true);
  };

  const handleSendMessage = async () => {
    console.log('Sending message to supplier:', {
      supplier: selectedSupplier,
      product: selectedProduct,
      message: contactMessage
    });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Message sent successfully!');
      setShowContactModal(false);
      setContactMessage('');
      setSelectedProduct(null);
      setSelectedSupplier(null);
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleNavigateToProduct = (productId: string) => {
    navigate(`/buyer/products/${productId}`);
  };

  const handleCategorySelect = (category: ProductCategory | 'all') => {
    setSelectedCategory(category);
    toast.info(`Filtering by: ${category === 'all' ? 'All Categories' : category}`);
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange([min, max]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterProducts();
    if (searchQuery.trim()) {
      toast.info(`Searching for: "${searchQuery}"`);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setPriceRange([0, 1000]);
    setSearchQuery('');
    setMaxDistance(100);
    setSelectedDistrict('all');
    setSelectedCity('all');
    setUserLocation(null);
    setLocationError(null);
    toast.info('All filters cleared');
  };

  const groupProductsBySupplier = () => {
    const suppliersMap = new Map<string, ProductResponse[]>();
    
    filteredProducts.forEach(product => {
      const supplierKey = product.farmer_id;
      if (!suppliersMap.has(supplierKey)) {
        suppliersMap.set(supplierKey, []);
      }
      suppliersMap.get(supplierKey)!.push(product);
    });

    return Array.from(suppliersMap.entries()).map(([, products]) => ({
      farmer: {
        id: products[0].farmer_id,
        name: products[0].farmer_name,
        farm_name: products[0].farm_name,
        rating: products[0].rating,
        location: products[0].farm_location,
        coordinates: products[0].latitude && products[0].longitude ? {
          lat: products[0].latitude,
          lng: products[0].longitude
        } : undefined,
        joined_date: new Date().toISOString()
      },
      products
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading suppliers...</span>
      </div>
    );
  }

  if (error) {
    toast.error(`Error loading suppliers: ${error}`);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading suppliers</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const suppliers = groupProductsBySupplier();
  const cartItemCount = getCartItemCount();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      {/* Header with Cart Button */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppliers & Products</h1>
            <p className="mt-2 text-sm text-gray-600">
              Discover farmers and vendors in your area with their available products
            </p>
          </div>
          
          {/* Cart Button */}
          <button
            onClick={() => setShowCartModal(true)}
            className="relative px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>🛒</span>
            <span>Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
        
        {/* Location Status */}
        <div className="mt-4 flex items-center gap-4">
          {!userLocation ? (
            <button
              onClick={getUserLocation}
              disabled={isGettingLocation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {isGettingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Getting Location...</span>
                </>
              ) : (
                <>
                  <span>📍</span>
                  <span>Use My Location</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-blue-600">
              <span>📍</span>
              <span>Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
              <button
                onClick={() => {
                  setUserLocation(null);
                  toast.info('Location cleared');
                }}
                className="ml-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          )}
          
          {locationError && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
              {locationError}
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products, suppliers, locations, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Category Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleCategorySelect('all')}
                className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${
                  selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {productCategories.slice(0, 4).map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategorySelect(category.value)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium flex items-center gap-2 ${
                    selectedCategory === category.value
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{getCategoryIcon(category.value)}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location Filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Location</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Distance</label>
                <select
                  value={maxDistance}
                  onChange={(e) => {
                    setMaxDistance(Number(e.target.value));
                    toast.info(`Distance filter set to ${e.target.value}km`);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  disabled={!userLocation}
                >
                  <option value={10}>Within 10km</option>
                  <option value={25}>Within 25km</option>
                  <option value={50}>Within 50km</option>
                  <option value={100}>Within 100km</option>
                  <option value={250}>Within 250km</option>
                  <option value={1000}>Any distance</option>
                </select>
                {!userLocation && (
                  <p className="text-xs text-gray-500 mt-1">Enable location to filter by distance</p>
                )}
              </div>
              
              {districts.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">District</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      if (e.target.value !== 'all') {
                        toast.info(`Filtering by district: ${e.target.value}`);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Districts</option>
                    {districts.map((district: string) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* City Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">City/Area</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedCity('all');
                  toast.info('Showing all cities');
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${
                  selectedCity === 'all'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Cities
              </button>
              {cities.slice(0, 6).map((city: string) => (
                <button
                  key={city}
                  onClick={() => {
                    setSelectedCity(city);
                    toast.info(`Filtering by city: ${city}`);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${
                    selectedCity === city
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Price Range (USD)</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange[0]}
                  onChange={(e) => handlePriceRangeChange(Number(e.target.value), priceRange[1])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500 text-sm">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange[1]}
                  onChange={(e) => handlePriceRangeChange(priceRange[0], Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {suppliers.length} suppliers, {filteredProducts.length} products
                </span>
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="space-y-8">
        {suppliers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or filters to find more results.
            </p>
          </div>
        ) : (
          suppliers.map(({ farmer, products }) => (
            <SupplierCard 
              key={farmer.id} 
              farmer={farmer} 
              products={products}
              userLocation={userLocation}
              onViewDetails={handleViewDetails}
              onContactSupplier={handleContactSupplier}
              onAddToCart={addToCart}
              cartQuantities={cartQuantities}
            />
          ))
        )}
      </div>

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          userLocation={userLocation}
          onClose={() => setShowProductModal(false)}
          onContactSupplier={(product) => {
            setShowProductModal(false);
            const supplier = suppliers.find(s => s.farmer.id === product.farmer_id)?.farmer;
            if (supplier) {
              handleContactSupplier(product, supplier);
            }
          }}
          onAddToCart={addToCart}
          cartQuantity={cartQuantities[selectedProduct.id] || 0}
          onNavigateToProduct={handleNavigateToProduct}
        />
      )}

      {/* Contact Supplier Modal */}
      {showContactModal && selectedProduct && selectedSupplier && (
        <ContactModal
          product={selectedProduct}
          supplier={selectedSupplier}
          message={contactMessage}
          onMessageChange={setContactMessage}
          onSend={handleSendMessage}
          onClose={() => {
            setShowContactModal(false);
            setSelectedProduct(null);
            setSelectedSupplier(null);
            setContactMessage('');
          }}
        />
      )}

      {/* Shopping Cart Modal */}
      {showCartModal && (
        <CartModal
          cart={cart}
          cartQuantities={cartQuantities}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onProceedToCheckout={proceedToCheckout}
          onClose={() => setShowCartModal(false)}
        />
      )}
    </div>
  );
};

// Enhanced Supplier Card Component with Add to Cart
interface SupplierCardProps {
  farmer: {
    id: string;
    name: string;
    farm_name: string;
    rating: number;
    location: string;
    coordinates?: { lat: number; lng: number };
    joined_date?: string;
  };
  products: ProductResponse[];
  userLocation: { lat: number; lng: number } | null;
  onViewDetails: (product: ProductResponse) => void;
  onContactSupplier: (product: ProductResponse, supplier: any) => void;
  onAddToCart: (product: ProductResponse) => void;
  cartQuantities: { [key: string]: number };
}

const SupplierCard: React.FC<SupplierCardProps> = ({ 
  farmer, 
  products, 
  userLocation,
  onViewDetails, 
  onContactSupplier,
  onAddToCart,
  cartQuantities
}) => {
  const [showAllProducts, setShowAllProducts] = useState(false);
  
  const displayedProducts = showAllProducts ? products : products.slice(0, 4);

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'Recently joined';
    return new Date(dateString).getFullYear().toString();
  };

  const calculateSupplierDistance = () => {
    if (!userLocation || !farmer.coordinates) return null;
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      farmer.coordinates.lat,
      farmer.coordinates.lng
    );
    
    return distance;
  };

  const supplierDistance = calculateSupplierDistance();
  const locationInfo = parseLocation(farmer.location);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Supplier Header */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {farmer.farm_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{farmer.farm_name}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>👤 {farmer.name}</span>
                <span>📍 {locationInfo.city}, {locationInfo.district}</span>
                {supplierDistance && (
                  <span className="flex items-center space-x-1">
                    <span>📏</span>
                    <span className="font-medium text-blue-600">
                      {supplierDistance < 1 
                        ? `${Math.round(supplierDistance * 1000)}m away`
                        : `${supplierDistance.toFixed(1)}km away`
                      }
                    </span>
                  </span>
                )}
                <span>📅 Member since {formatJoinDate(farmer.joined_date)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 justify-end">
              <span className="text-yellow-400">⭐</span>
              <span className="text-sm font-medium text-gray-900">{farmer.rating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-gray-500">{products.length} products</p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedProducts.map((product: ProductResponse) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              supplier={farmer}
              userLocation={userLocation}
              onViewDetails={onViewDetails}
              onContactSupplier={onContactSupplier}
              onAddToCart={onAddToCart}
              cartQuantity={cartQuantities[product.id] || 0}
            />
          ))}
        </div>

        {/* Show More/Less Toggle */}
        {products.length > 4 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAllProducts(!showAllProducts)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              {showAllProducts ? 'Show Less' : `Show All ${products.length} Products`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Product Card Component with Add to Cart
interface ProductCardProps {
  product: ProductResponse;
  supplier: any;
  userLocation: { lat: number; lng: number } | null;
  onViewDetails: (product: ProductResponse) => void;
  onContactSupplier: (product: ProductResponse, supplier: any) => void;
  onAddToCart: (product: ProductResponse) => void;
  cartQuantity: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  userLocation,
  onViewDetails, 
  onAddToCart,
  cartQuantity
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getProductDistance = () => {
    if (!userLocation || !product.latitude || !product.longitude) {
      return null;
    }
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      product.latitude,
      product.longitude
    );
    
    return distance;
  };

  const distance = getProductDistance();
  const locationInfo = parseLocation(product.farm_location);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Product Image with Distance Badge */}
      <div className="relative">
        <div className="aspect-w-16 aspect-h-9 bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-48 object-cover cursor-pointer"
              onClick={() => onViewDetails(product)}
            />
          ) : (
            <div 
              className="w-full h-48 bg-gray-200 flex items-center justify-center cursor-pointer"
              onClick={() => onViewDetails(product)}
            >
              <span className="text-4xl">{getCategoryIcon(product.category)}</span>
            </div>
          )}
        </div>
        {distance && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
            {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
          </div>
        )}
        {cartQuantity > 0 && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
            In Cart: {cartQuantity}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 
            className="font-medium text-gray-900 line-clamp-2 flex-1 cursor-pointer hover:text-blue-600"
            onClick={() => onViewDetails(product)}
          >
            {product.name}
          </h4>
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            {product.category}
          </span>
        </div>

        {/* Location Info */}
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <span>📍 {locationInfo.city}</span>
          {locationInfo.district && locationInfo.district !== locationInfo.city && (
            <span className="mx-1">•</span>
          )}
          {locationInfo.district && locationInfo.district !== locationInfo.city && (
            <span>{locationInfo.district}</span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price_per_unit)}/{product.unit}
            </span>
            {product.organic && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                Organic
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Stock: {product.available_stock}</span>
            <div className="flex items-center space-x-1">
              <span>⭐ {product.rating}</span>
              <span>({product.review_count})</span>
            </div>
          </div>

          {product.quality_grade && (
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Grade: {product.quality_grade}</span>
              <span>Min: {product.min_order}{product.unit}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex space-x-2">
          <button 
            onClick={() => onAddToCart(product)}
            disabled={product.available_stock === 0}
            className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {product.available_stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <button 
            onClick={() => onViewDetails(product)}
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Product Modal with Add to Cart
interface ProductModalProps {
  product: ProductResponse;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onContactSupplier: (product: ProductResponse) => void;
  onAddToCart: (product: ProductResponse) => void;
  cartQuantity: number;
  onNavigateToProduct: (productId: string) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ 
  product, 
  userLocation,
  onClose, 
  onContactSupplier,
  onAddToCart,
  cartQuantity,
  onNavigateToProduct 
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getProductDistance = () => {
    if (!userLocation || !product.latitude || !product.longitude) {
      return null;
    }
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      product.latitude,
      product.longitude
    );
    
    return distance;
  };

  const distance = getProductDistance();
  const locationInfo = parseLocation(product.farm_location);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>By {product.farm_name}</span>
                <span>📍 {locationInfo.city}, {locationInfo.district}</span>
                {distance && (
                  <span className="text-blue-600 font-medium">
                    {distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div>
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-6xl">{getCategoryIcon(product.category)}</span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                <p className="text-gray-600 mt-1">{product.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Price</span>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPrice(product.price_per_unit)}/{product.unit}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Available Stock</span>
                  <p className="text-lg font-semibold text-gray-900">{product.available_stock} {product.unit}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Category</span>
                  <p className="text-gray-900 capitalize">{product.category}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Quality Grade</span>
                  <p className="text-gray-900 capitalize">{product.quality_grade}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Location</span>
                  <p className="text-gray-900">{locationInfo.city}, {locationInfo.district}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Minimum Order</span>
                  <p className="text-gray-900">{product.min_order} {product.unit}</p>
                </div>
              </div>

              {product.organic && (
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Certified Organic
                  </span>
                </div>
              )}

              {cartQuantity > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    <strong>{cartQuantity}</strong> of this item in your cart
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => onAddToCart(product)}
                  disabled={product.available_stock === 0}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {product.available_stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button
                  onClick={() => onContactSupplier(product)}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Contact Supplier
                </button>
              </div>
              
              <button
                onClick={() => onNavigateToProduct(product.id)}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                View Full Product Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Shopping Cart Modal Component
interface CartModalProps {
  cart: CartItem[];
  cartQuantities: { [key: string]: number };
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onClose: () => void;
}

const CartModal: React.FC<CartModalProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onClose
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getTotalPrice = (): number => {
    return cart.reduce((total: number, item: CartItem) => total + (item.unit_price * item.quantity), 0);
  };

  const getTotalItems = (): number => {
    return cart.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
              <p className="text-sm text-gray-600 mt-1">
                {getTotalItems()} items in your cart
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some products to get started</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.map((item: CartItem) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400">📦</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                      <p className="text-sm text-gray-600">From: {item.farm_name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>Price: {formatPrice(item.unit_price)}/{item.unit}</span>
                        {item.organic && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Organic
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                          disabled={item.quantity <= item.min_order}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                          disabled={item.quantity >= item.available_stock}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right min-w-20">
                        <div className="font-medium text-gray-900">
                          {formatPrice(item.unit_price * item.quantity)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onRemoveItem(item.product_id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {getTotalItems()} items from {new Set(cart.map((item: CartItem) => item.farm_name)).size} suppliers
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClearCart}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Cart
                </button>
                <button
                  onClick={onProceedToCheckout}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Contact Modal Component
interface ContactModalProps {
  product: ProductResponse;
  supplier: any;
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({
  product,
  supplier,
  message,
  onMessageChange,
  onSend,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900">Contact Supplier</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Supplier Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {supplier.farm_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{supplier.farm_name}</h3>
                <p className="text-sm text-gray-600">Regarding: {product.name}</p>
              </div>
            </div>
          </div>

          {/* Message Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                id="message"
                rows={4}
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type your message to the supplier..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onSend}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Send Message
              </button>
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate distance (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper function to parse location strings
const parseLocation = (locationString: string): LocationInfo => {
  const parts = locationString.split(',').map(part => part.trim());
  
  if (parts.length === 3) {
    return {
      city: parts[0],
      district: parts[1],
      state: parts[1],
      country: parts[2]
    };
  } else if (parts.length === 2) {
    return {
      city: parts[0],
      district: parts[1],
      state: parts[1],
      country: 'Nepal'
    };
  }
  
  return {
    city: locationString,
    district: locationString,
    state: locationString,
    country: 'Nepal'
  };
};

export default Suppliers;