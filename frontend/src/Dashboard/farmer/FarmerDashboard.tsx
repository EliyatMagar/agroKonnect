// Dashboard/farmer/FarmerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useMyFarmerProfile } from '../../features/farmer/hooks/farmerHooks';
import { useAuthContext } from '../../features/auth/context/AuthProvider';
import { FarmerProfile } from '../../features/farmer/pages/FarmerProfile';
import { ProductManagement } from '../../features/farmer/products/ProductManagement';
import { ProductDetails } from '../../features/farmer/products/ProductDetails';
import { FarmerOrders } from '../../features/farmer/orders/FarmerOrders';
import { FarmerAnalytics } from '../../features/farmer/analytics/FarmerAnalytics';
import { OrderStats } from '../../features/farmer/orders/OrderStats'; 
import { useFarmerOrders } from '../../features/farmer/orders/useFarmerOrders';
import { useProducts } from '../../features/product/hooks/productHooks';
import type { ProductResponse } from '../../features/product/types/productTypes';

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
  const { stats: orderStats, loading: ordersLoading } = useFarmerOrders();
  const { getMyProducts, loading: productsLoading } = useProducts();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [revenueData, setRevenueData] = useState({
    total: 0,
    monthly: 0,
    weekly: 0
  });

  const navigate = useNavigate();

  // Load products data
  useEffect(() => {
    const loadProducts = async () => {
      const myProducts = await getMyProducts();
      if (myProducts) {
        setProducts(myProducts);
        
        // Calculate revenue from products (using available stock as mock sales data)
        const totalRevenue = myProducts.reduce((sum, product) => {
          // Use price * available stock as a proxy for revenue, or a fixed multiplier
          const estimatedSales = product.available_stock * 2; // Mock multiplier
          return sum + (product.price_per_unit * estimatedSales);
        }, 0);
        
        setRevenueData({
          total: totalRevenue,
          monthly: totalRevenue * 0.3, // 30% of total
          weekly: totalRevenue * 0.1   // 10% of total
        });
      }
    };
    
    loadProducts();
  }, [getMyProducts]);

  const handleAddProduct = () => {
    navigate('/farmer/products?action=create');
  };

  const handleViewAnalytics = () => {
    navigate('/farmer/analytics');
  };

  const handleUpdateProfile = () => {
    navigate('/farmer/profile');
  };

  const handleManageOrders = () => {
    navigate('/farmer/orders');
  };

  // Calculate additional stats
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStockProducts = products.filter(p => p.available_stock < 10).length;
  const totalProducts = products.length;

  const stats = [
    {
      title: "Total Revenue",
      value: `$${revenueData.total.toLocaleString()}`,
      change: "+12.5%",
      trend: "up" as const,
      icon: "💰",
      color: "from-amber-500 to-yellow-500",
      bgColor: "from-amber-50 to-yellow-50",
      description: "All time earnings"
    },
    {
      title: "Active Products",
      value: activeProducts.toString(),
      change: "+8.3%",
      trend: "up" as const,
      icon: "🌱",
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
      description: "Currently listed"
    },
    {
      title: "Pending Orders",
      value: orderStats.pending?.toString() || "0",
      change: "-2.1%",
      trend: "down" as const,
      icon: "📦",
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      description: "Need attention"
    },
    {
      title: "Customer Satisfaction",
      value: "4.8",
      change: "+0.2",
      trend: "up" as const,
      icon: "⭐",
      color: "from-purple-500 to-violet-500",
      bgColor: "from-purple-50 to-violet-50",
      description: "Out of 5.0"
    }
  ];

  const quickActions = [
    {
      title: "Add Product",
      description: "List new farm products for sale",
      icon: "➕",
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
      onClick: handleAddProduct
    },
    {
      title: "View Analytics",
      description: "Check your sales performance",
      icon: "📊",
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      onClick: handleViewAnalytics
    },
    {
      title: "Manage Orders",
      description: "Process customer orders",
      icon: "🛒",
      color: "from-orange-500 to-amber-500",
      bgColor: "from-orange-50 to-amber-50",
      onClick: handleManageOrders
    },
    {
      title: "Update Profile",
      description: "Edit farm information",
      icon: "📝",
      color: "from-purple-500 to-violet-500",
      bgColor: "from-purple-50 to-violet-50",
      onClick: handleUpdateProfile
    }
  ];

  const recentActivities = [
    { type: 'order', message: 'New order #FARM-001 received', time: '2 min ago', icon: '🛒' },
    { type: 'product', message: 'Organic Tomatoes stock updated', time: '1 hour ago', icon: '🌱' },
    { type: 'review', message: 'New 5-star review received', time: '3 hours ago', icon: '⭐' },
    { type: 'order', message: 'Order #FARM-002 shipped', time: '5 hours ago', icon: '🚚' }
  ];

  const isLoading = ordersLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <div className="h-8 bg-gray-200 rounded w-64 mb-3 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="w-32 h-16 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome back, <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {farmerProfile.farm_name || farmerProfile.full_name}
            </span>!
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Here's what's happening with your farm today. You have {orderStats.pending || 0} orders needing attention.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🌾</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Farm Status</p>
            <p className="text-lg font-semibold text-gray-900">Active</p>
          </div>
        </div>
      </div>
      
      {/* Order Stats Component */}
      <OrderStats />
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    stat.trend === 'up' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {stat.trend === 'up' ? '↗' : '↘'} {stat.change}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats & Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <span className="text-sm text-gray-500">{quickActions.length} available</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {quickActions.map((action, index) => (
              <button 
                key={index}
                onClick={action.onClick}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${action.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{action.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{action.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{action.description}</p>
                <div className="mt-4 flex items-center text-green-600 text-sm font-medium">
                  Get started
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            <span className="text-sm text-gray-500">Today</span>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{activity.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={handleViewAnalytics}
            className="w-full mt-4 text-center text-green-600 hover:text-green-700 text-sm font-medium py-2 border border-gray-200 rounded-lg hover:border-green-200 transition-colors"
          >
            View All Activity
          </button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Performance Overview</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Last 30 days</span>
            <button 
              onClick={handleViewAnalytics}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              View Details →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-green-600 mb-2">+15%</div>
            <div className="text-sm text-gray-600">Sales Growth</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-blue-600 mb-2">92%</div>
            <div className="text-sm text-gray-600">Order Completion</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-purple-600 mb-2">4.8</div>
            <div className="text-sm text-gray-600">Avg. Rating</div>
          </div>
        </div>
        <div className="mt-6 h-2 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full"></div>
      </div>
    </div>
  );
};