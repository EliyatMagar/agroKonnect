// features/farmer/analytics/FarmerAnalytics.tsx
import React, { useState, useMemo } from 'react';
import { useFarmerStats } from '../hooks/farmerHooks';
import { useOrders } from '../../../features/order/hooks/useOrders';
import { useProducts } from '../../product/hooks/productHooks';
import { Link } from 'react-router-dom';
import type { OrderStatus } from '../../../features/order/types/orderTypes';

export const FarmerAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'revenue'>('overview');

  // Fetch data using your existing hooks
  const { data: farmerStats, isLoading: statsLoading } = useFarmerStats();
  const { getFarmerOrders, getOrderSummary, loading: ordersLoading } = useOrders();
  const { getMyProducts, loading: productsLoading } = useProducts();

  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState({
    revenue: { total: 0, change: 0, trend: [] as number[] },
    orders: { total: 0, delivered: 0, pending: 0, cancelled: 0, trend: [] as number[] },
    products: { total: 0, active: 0, outOfStock: 0, topPerforming: [] as any[] },
    customers: { total: 0, returning: 0, new: 0, satisfaction: 0 }
  });

  // Load analytics data
  React.useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        // Fetch orders for analytics
        const ordersResponse = await getFarmerOrders(1, 100);
        const products = await getMyProducts();
        
        if (ordersResponse && products) {
          // Calculate revenue metrics - use 'delivered' status instead of 'completed'
          const revenueData = ordersResponse.orders.reduce((acc, order) => {
            if (order.status === 'delivered') { // Changed from 'completed' to 'delivered'
              acc.total += order.total_amount;
              acc.delivered++;
            }
            return acc;
          }, { total: 0, delivered: 0 });

          // Calculate product metrics
          const productStats = products.reduce((acc, product) => {
            acc.total++;
            if (product.status === 'active') {
              acc.active++;
            }
            if (product.available_stock === 0) {
              acc.outOfStock++;
            }
            return acc;
          }, { total: 0, active: 0, outOfStock: 0 });

          // Get top performing products (mock for now)
          const topPerforming = products
            .slice(0, 3)
            .map(product => ({
              id: product.id,
              name: product.name,
              sales: Math.floor(Math.random() * 50) + 10, // Mock sales data
              revenue: product.price_per_unit * (Math.floor(Math.random() * 50) + 10)
            }));

          setAnalyticsData({
            revenue: {
              total: revenueData.total,
              change: 15.2, // Mock growth
              trend: [1200, 1800, 1500, 2200, 1900, 2500, 2800] // Mock trend
            },
            orders: {
              total: ordersResponse.orders.length,
              delivered: ordersResponse.orders.filter(o => o.status === 'delivered').length, // Use delivered
              pending: ordersResponse.orders.filter(o => o.status === 'pending').length,
              cancelled: ordersResponse.orders.filter(o => o.status === 'cancelled').length,
              trend: [12, 18, 15, 22, 19, 25, 28] // Mock trend
            },
            products: {
              total: productStats.total,
              active: productStats.active,
              outOfStock: productStats.outOfStock,
              topPerforming
            },
            customers: {
              total: 89, // Mock data
              returning: 45,
              new: 44,
              satisfaction: 4.8
            }
          });
        }
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      }
    };

    loadAnalyticsData();
  }, [getFarmerOrders, getMyProducts, timeRange]);

  const isLoading = statsLoading || ordersLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Farm Analytics</h1>
          <p className="text-gray-600 mt-2">Track your farm's performance and growth</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                timeRange === range
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'products', name: 'Products', icon: '🌱' },
            { id: 'orders', name: 'Orders', icon: '📦' },
            { id: 'revenue', name: 'Revenue', icon: '💰' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Analytics Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && <OverviewTab data={analyticsData} />}
        {activeTab === 'products' && <ProductsTab data={analyticsData.products} />}
        {activeTab === 'orders' && <OrdersTab data={analyticsData.orders} />}
        {activeTab === 'revenue' && <RevenueTab data={analyticsData.revenue} />}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${data.revenue.total.toLocaleString()}`}
          change={data.revenue.change}
          icon="💰"
          trend={data.revenue.trend}
        />
        <MetricCard
          title="Total Orders"
          value={data.orders.total.toString()}
          change={12.5}
          icon="📦"
          trend={data.orders.trend}
        />
        <MetricCard
          title="Active Products"
          value={data.products.total.toString()}
          change={8.3}
          icon="🌱"
          trend={[20, 22, 23, 24, 23, 24, 24]}
        />
        <MetricCard
          title="Customer Satisfaction"
          value={data.customers.satisfaction.toString()}
          change={2.1}
          icon="⭐"
          trend={[4.7, 4.8, 4.8, 4.7, 4.8, 4.8, 4.8]}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <Link to="/farmer/orders" className="text-green-600 hover:text-green-700 text-sm font-medium">
              View orders →
            </Link>
          </div>
          <div className="h-64 flex items-end justify-between space-x-2">
            {data.revenue.trend.map((value: number, index: number) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${(value / Math.max(...data.revenue.trend)) * 80}%` }}
                />
                <span className="text-xs text-gray-500 mt-2">Day {index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
            <Link to="/farmer/orders" className="text-green-600 hover:text-green-700 text-sm font-medium">
              Manage orders →
            </Link>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{data.orders.total}</div>
                  <div className="text-sm text-gray-500">Total Orders</div>
                </div>
              </div>
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#e5e7eb"
                  strokeWidth="16"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#10b981"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${(data.orders.delivered / data.orders.total) * 502} 502`}
                />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-green-600 font-semibold">{data.orders.delivered}</div> {/* Use delivered */}
              <div className="text-xs text-gray-500">Delivered</div> {/* Updated label */}
            </div>
            <div>
              <div className="text-yellow-600 font-semibold">{data.orders.pending}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
            <div>
              <div className="text-red-600 font-semibold">{data.orders.cancelled}</div>
              <div className="text-xs text-gray-500">Cancelled</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Products Tab Component
const ProductsTab: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-3xl mb-2">🌱</div>
          <div className="text-2xl font-bold text-gray-900">{data.total}</div>
          <div className="text-gray-500">Total Products</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-gray-900">{data.active}</div>
          <div className="text-gray-500">Active Listings</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-3xl mb-2">⏸️</div>
          <div className="text-2xl font-bold text-gray-900">{data.outOfStock}</div>
          <div className="text-gray-500">Out of Stock</div>
        </div>
      </div>

      {/* Top Performing Products */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Products</h3>
          <Link to="/farmer/products" className="text-green-600 hover:text-green-700 text-sm font-medium">
            Manage products →
          </Link>
        </div>
        <div className="space-y-4">
          {data.topPerforming.map((product: any) => (
            <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🌱</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.sales} units sold</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">${product.revenue}</div>
                <div className="text-sm text-green-600">${(product.revenue / product.sales).toFixed(2)} avg</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Orders Tab Component
const OrdersTab: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-3xl mb-2">📦</div>
          <div className="text-2xl font-bold text-gray-900">{data.total}</div>
          <div className="text-gray-500">Total Orders</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-gray-900">{data.delivered}</div> {/* Use delivered */}
          <div className="text-gray-500">Delivered</div> {/* Updated label */}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-2xl font-bold text-gray-900">{data.pending}</div>
          <div className="text-gray-500">Pending</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-3xl mb-2">❌</div>
          <div className="text-2xl font-bold text-gray-900">{data.cancelled}</div>
          <div className="text-gray-500">Cancelled</div>
        </div>
      </div>

      {/* Order Trends */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Order Trends</h3>
          <Link to="/farmer/orders" className="text-green-600 hover:text-green-700 text-sm font-medium">
            View all orders →
          </Link>
        </div>
        <div className="h-64">
          <div className="flex items-end justify-between h-48 space-x-2">
            {data.trend.map((value: number, index: number) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${(value / Math.max(...data.trend)) * 100}%` }}
                />
                <span className="text-xs text-gray-500 mt-2">{value}</span>
                <span className="text-xs text-gray-400">Day {index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Revenue Tab Component
const RevenueTab: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-2xl font-bold text-gray-900">${data.total.toLocaleString()}</div>
          <div className="text-gray-500">Total Revenue</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-3xl mb-2">📈</div>
          <div className="text-2xl font-bold text-green-600">+{data.change}%</div>
          <div className="text-gray-500">Growth Rate</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold text-gray-900">${(data.total / 30).toFixed(0)}</div>
          <div className="text-gray-500">Daily Average</div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
          <Link to="/farmer/orders" className="text-green-600 hover:text-green-700 text-sm font-medium">
            View revenue details →
          </Link>
        </div>
        <div className="h-80">
          <div className="flex items-end justify-between h-64 space-x-1">
            {data.trend.map((value: number, index: number) => (
              <div key={index} className="flex flex-col items-center flex-1 group">
                <div
                  className="w-full bg-gradient-to-t from-emerald-500 to-green-400 rounded-t-lg transition-all group-hover:from-emerald-600 group-hover:to-green-500"
                  style={{ height: `${(value / Math.max(...data.trend)) * 100}%` }}
                />
                <div className="text-xs text-gray-500 mt-2">${value}</div>
                <div className="text-xs text-gray-400">Day {index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string;
  change: number;
  icon: string;
  trend: number[];
}> = ({ title, value, change, icon, trend }) => {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl">{icon}</div>
        <div className={`flex items-center space-x-1 text-sm ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          <span>{isPositive ? '↗' : '↘'}</span>
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
      
      {/* Mini trend chart */}
      <div className="mt-4 flex items-end justify-between h-8 space-x-1">
        {trend.slice(-7).map((value, index) => (
          <div
            key={index}
            className="flex-1 bg-gray-200 rounded-t-sm transition-all hover:bg-green-300"
            style={{ height: `${(value / Math.max(...trend)) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default FarmerAnalytics;