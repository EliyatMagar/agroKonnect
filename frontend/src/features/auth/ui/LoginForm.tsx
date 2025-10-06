import React, { useState, useEffect } from 'react';
import { useLogin } from '../hooks/useAuth';
import type { LoginRequest } from '../types/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthProvider';

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const { hasProfile, profileLoading, userRole, isAuthenticated, user } = useAuthContext();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const getProfileRoute = (role: string): string => {
    return `/${role}/create-profile`;
  };

  const getDashboardRoute = (role: string): string => {
    switch (role) {
      case 'farmer':
        return '/farmer/dashboard';
      case 'vendor':
        return '/vendor/dashboard';
      case 'transporter':
        return '/transporter/dashboard';
      case 'buyer':
        return '/buyer/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/dashboard';
    }
  };

  // Handle successful login and redirect
  useEffect(() => {
    if (loginMutation.isSuccess && userRole && !profileLoading) {
      console.log('🚀 Login successful, checking profile status...');
      
      // Small delay to ensure state is updated
      const timer = setTimeout(() => {
        console.log('🔧 Redirect check:', {
          hasProfile,
          userRole,
          profileLoading,
          user
        });
        
        if (hasProfile) {
          // Profile exists, go to dashboard
          const dashboardRoute = getDashboardRoute(userRole);
          console.log('📍 Redirecting to dashboard:', dashboardRoute);
          navigate(dashboardRoute, { replace: true });
          toast.success(`Welcome back! Redirecting to ${userRole} dashboard.`);
        } else {
          // No profile, go to profile creation
          const profileRoute = getProfileRoute(userRole);
          console.log('📍 Redirecting to profile creation:', profileRoute);
          navigate(profileRoute, { replace: true });
          toast.info(`Please complete your ${userRole} profile to continue.`);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [loginMutation.isSuccess, hasProfile, profileLoading, userRole, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔄 Login form submitted:', { ...formData, password: '***' });
    
    // DEBUG: Check localStorage before login
    console.log('🔧 Pre-login localStorage check:', {
      hasAccessToken: !!localStorage.getItem('access_token'),
      hasRefreshToken: !!localStorage.getItem('refresh_token'),
      hasUserData: !!localStorage.getItem('user_data')
    });
    
    loginMutation.mutate(formData, {
      onSuccess: (data) => {
        console.log('✅ Login mutation success:', {
          user: data.user,
          hasAccessToken: !!data.access_token,
          hasRefreshToken: !!data.refresh_token
        });
        
        toast.success('Login successful! Redirecting...');
      },
      onError: (error: any) => {
        console.error('❌ Login mutation error:', error);
        
        let errorMessage = 'Login failed. Please check your credentials.';
        if (error.message) {
          if (error.message.includes('Invalid credentials')) {
            errorMessage = 'Invalid email or password.';
          } else if (error.message.includes('account is deactivated')) {
            errorMessage = 'Your account has been deactivated.';
          } else {
            errorMessage = error.message;
          }
        }
        
        toast.error(errorMessage);
        
        // Clear form on error for security
        setFormData(prev => ({
          email: prev.email,
          password: '',
        }));
      }
    });
  };

  const handleDemoLogin = (role: 'farmer' | 'buyer' | 'vendor' | 'transporter') => {
    const demoCredentials: Record<string, LoginRequest> = {
      farmer: { email: 'demo-farmer@agrix.com', password: 'demo123' },
      buyer: { email: 'demo-buyer@agrix.com', password: 'demo123' },
      vendor: { email: 'demo-vendor@agrix.com', password: 'demo123' },
      transporter: { email: 'demo-transporter@agrix.com', password: 'demo123' },
    };

    setFormData(demoCredentials[role]);
    toast.info(`Demo ${role} credentials filled. Click Sign in to continue.`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <a
              href="/signup"
              className="font-medium text-green-600 hover:text-green-500 transition-colors duration-200"
            >
              create a new account
            </a>
          </p>
        </div>

        {/* Demo Login Buttons */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Demo Accounts</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('farmer')}
              className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1 px-2 rounded transition-colors duration-200"
            >
              Farmer Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('buyer')}
              className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1 px-2 rounded transition-colors duration-200"
            >
              Buyer Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('vendor')}
              className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1 px-2 rounded transition-colors duration-200"
            >
              Vendor Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('transporter')}
              className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1 px-2 rounded transition-colors duration-200"
            >
              Transporter Demo
            </button>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="Email address"
                disabled={loginMutation.isPending}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="Password"
                disabled={loginMutation.isPending}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loginMutation.isPending}
              >
                <span className="text-gray-500 text-sm hover:text-gray-700 transition-colors duration-200">
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-colors duration-200"
                disabled={loginMutation.isPending}
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="/forgot-password"
                className="font-medium text-green-600 hover:text-green-500 transition-colors duration-200"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};