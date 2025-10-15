// Dashboard/farmer/FarmerDashboard.tsx
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useMyFarmerProfile } from '../../features/farmer/hooks/farmerHooks';
import { useAuthContext } from '../../features/auth/context/AuthProvider';
import { FarmerProfile } from '../../features/farmer/pages/FarmerProfile';
import { ProductManagement } from '../../features/farmer/products/ProductManagement';
import { ProductDetails } from '../../features/farmer/products/ProductDetails';
import { FarmerOrders } from '../../features/farmer/orders/FarmerOrders';
import { FarmerAnalytics } from '../../features/farmer/analytics/FarmerAnalytics';
import { OrderStats } from '../../features/farmer/orders/OrderStats'; 

export const FarmerDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: farmerProfile, isLoading } = useMyFarmerProfile();
  const { logout } = useAuthContext();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/farmer/dashboard', current: location.pathname === '/farmer/dashboard', icon: '📊' },
    { name: 'Products', href: '/farmer/products', current: location.pathname === '/farmer/products', icon: '🌱' },
    { name: 'Orders', href: '/farmer/orders', current: location.pathname === '/farmer/orders', icon: '📦' },
    { name: 'Analytics', href: '/farmer/analytics', current: location.pathname === '/farmer/analytics', icon: '📈' },
    { name: 'Profile', href: '/farmer/profile', current: location.pathname === '/farmer/profile', icon: '👤' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!farmerProfile) {
    return <Navigate to="/farmer/create-profile" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      {/* Modern Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-lg">🌾</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Farmer Portal
                </h1>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'bg-green-50 text-green-700 border-green-200 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent'
                    } inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ease-in-out group`}
                  >
                    <span className="mr-2 text-base">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* User Menu & Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50/80 rounded-lg px-3 py-2">
                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-medium">
                    {farmerProfile.full_name?.charAt(0) || 'F'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{farmerProfile.full_name}</p>
                  <p className="text-xs text-gray-500">Farmer</p>
                </div>
              </div>
              
              <button
                onClick={confirmLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 ease-in-out border border-gray-200 hover:border-red-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden md:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <Routes>
            <Route path="/" element={<DashboardHome farmerProfile={farmerProfile} />} />
            <Route path="/dashboard" element={<DashboardHome farmerProfile={farmerProfile} />} />
            <Route path="/profile" element={<FarmerProfile farmer={farmerProfile} />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/orders" element={<FarmerOrders />} />
            <Route path="/analytics" element={<FarmerAnalytics />} />
          </Routes>
        </div> 
      </div>

      {/* Modern Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center space-x-4 mb-5">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
                <p className="text-sm text-gray-500 mt-1">Farmer Account</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-7 leading-relaxed">
              Are you sure you want to logout from your farmer account? You'll need to sign in again to access your dashboard.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 border border-transparent rounded-xl hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modern Dashboard Home Component
interface DashboardHomeProps {
  farmerProfile: any;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ farmerProfile }) => {
  const handleAddProduct = () => {
    window.location.href = '/farmer/products?action=create';
  };

  const handleViewAnalytics = () => {
    window.location.href = '/farmer/analytics';
  };

  const handleUpdateProfile = () => {
    window.location.href = '/farmer/profile';
  };

  const handleManageOrders = () => {
    window.location.href = '/farmer/orders';
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center sm:text-left">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Welcome back, <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{farmerProfile.farm_name || farmerProfile.full_name}</span>!
        </h1>
        <p className="text-lg text-gray-600">Here's what's happening with your farm today.</p>
      </div>
      
      {/* Order Stats Component */}
      <OrderStats />
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Products Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">24</p>
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Active listings
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">🌱</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Orders Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Orders</p>
                <p className="text-3xl font-bold text-gray-900">12</p>
                <p className="text-xs text-blue-600 mt-2 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Needs attention
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Revenue</p>
                <p className="text-3xl font-bold text-gray-900">$2,400</p>
                <p className="text-xs text-amber-600 mt-2 flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                  This month
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <button 
            onClick={handleAddProduct}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-lg hover:border-green-200 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
              <span className="text-2xl text-green-600">➕</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Add Product</h3>
            <p className="text-sm text-gray-500 leading-relaxed">List new farm products for sale</p>
          </button>

          <button 
            onClick={handleViewAnalytics}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-lg hover:border-blue-200 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
              <span className="text-2xl text-blue-600">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">View Analytics</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Check your sales performance</p>
          </button>

          <button 
            onClick={handleUpdateProfile}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-lg hover:border-purple-200 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
              <span className="text-2xl text-purple-600">📝</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Update Profile</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Edit farm information</p>
          </button>

          <button 
            onClick={handleManageOrders}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-lg hover:border-orange-200 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
              <span className="text-2xl text-orange-600">🛒</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">Manage Orders</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Process customer orders</p>
          </button>
        </div>
      </div>
    </div>
  );
};