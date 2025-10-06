// Dashboard/farmer/FarmerDashboard.tsx - UPDATED
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useMyFarmerProfile } from '../../features/farmer/hooks/farmerHooks';
import { useAuthContext } from '../../features/auth/context/AuthProvider';
import { FarmerProfile } from '../../features/farmer/pages/FarmerProfile';
import { FarmerProducts } from '../../features/farmer/products/FarmerProducts';
import { FarmerOrders } from '../../features/farmer/orders/FarmerOrders';
import { FarmerAnalytics } from '../../features/farmer/analytics/FarmerAnalytics';

export const FarmerDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: farmerProfile, isLoading } = useMyFarmerProfile();
  const { logout } = useAuthContext();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/farmer/dashboard', current: location.pathname === '/farmer/dashboard' },
    { name: 'Products', href: '/farmer/products', current: location.pathname === '/farmer/products' },
    { name: 'Orders', href: '/farmer/orders', current: location.pathname === '/farmer/orders' },
    { name: 'Analytics', href: '/farmer/analytics', current: location.pathname === '/farmer/analytics' },
    { name: 'Profile', href: '/farmer/profile', current: location.pathname === '/farmer/profile' },
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!farmerProfile) {
    return <Navigate to="/farmer/create-profile" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-green-600">Farmer Portal</h1>
              </div>
              <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'border-green-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* User Menu & Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">
                    {farmerProfile.full_name?.charAt(0) || 'F'}
                  </span>
                </div>
                <span className="text-sm text-gray-700 hidden md:block">
                  {farmerProfile.full_name}
                </span>
              </div>
              
              <div className="relative">
                <button
                  onClick={confirmLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden md:block">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Routes>
            <Route path="/" element={<DashboardHome farmerProfile={farmerProfile} />} />
            <Route path="/dashboard" element={<DashboardHome farmerProfile={farmerProfile} />} />
            <Route path="/profile" element={<FarmerProfile farmer={farmerProfile} />} />
            <Route path="/products" element={<FarmerProducts />} />
            <Route path="/orders" element={<FarmerOrders />} />
            <Route path="/analytics" element={<FarmerAnalytics />} />
          </Routes>
        </div> 
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Confirm Logout</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout from your farmer account? You'll need to sign in again to access your dashboard.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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

// Dashboard Home Component
interface DashboardHomeProps {
  farmerProfile: any;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ farmerProfile }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Welcome back, {farmerProfile.farm_name || farmerProfile.full_name}!
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard Stats */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600">📦</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd className="text-lg font-medium text-gray-900">24</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">🛒</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">12</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">$2,400</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-green-600 text-xl">➕</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-1">Add Product</h3>
          <p className="text-sm text-gray-500">List new farm products</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-blue-600 text-xl">📊</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-1">View Analytics</h3>
          <p className="text-sm text-gray-500">Check your sales performance</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-purple-600 text-xl">📝</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-1">Update Profile</h3>
          <p className="text-sm text-gray-500">Edit farm information</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-orange-600 text-xl">🛒</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-1">Manage Orders</h3>
          <p className="text-sm text-gray-500">Process customer orders</p>
        </div>
      </div>
    </div>
  );
};