import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, isAuthenticated } from '@api/auth';
import { AdminButton } from '@admin/components/AdminButton';
import { Loader2, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { CustomLoader } from '@components/common/CustomLoader';
import { SEOHead } from '@components/seo';

import { getAdminPath, getPublicHomeUrl, isAdminHost } from '@utils/host';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (isAuthenticated()) {
      navigate(getAdminPath('/dashboard'), { replace: true });
    } else {
      setCheckingAuth(false);
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate(getAdminPath('/dashboard'), { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <CustomLoader fullScreen={false} text="Checking access..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-6 sm:py-12">
      <SEOHead title="Admin Portal Login" canonicalPath={getAdminPath('/login')} noIndex={true} />

      <div className="max-w-[320px] sm:max-w-md w-full bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="px-4 py-5 sm:p-8">
          <div className="w-11 h-11 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3.5 sm:mb-6">
            <Lock className="w-5 h-5 sm:w-8 sm:h-8 text-saffron" />
          </div>

          <h2 className="text-xl sm:text-3xl font-bold text-center text-darkBrown tracking-wide mb-1 sm:mb-2 uppercase">
            Admin <span className="text-saffron">Access</span>
          </h2>
          <p className="text-xs sm:text-sm text-center text-gray-500 mb-4 sm:mb-8">
            Please login to access the dashboard
          </p>

          <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-9 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm rounded-md border border-gray-200 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-9 sm:h-12 pl-3 pr-9 sm:pl-4 sm:pr-11 text-xs sm:text-sm rounded-md border border-gray-200 focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-darkBrown transition-colors p-1 rounded-md cursor-pointer focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md text-xs sm:text-sm text-red-600 font-medium text-center">
                {error}
              </div>
            )}

            <AdminButton
              type="submit"
              size="lg"
              className="w-full h-9 sm:h-12 bg-saffron hover:bg-[#d96a1a] text-white font-bold text-xs sm:text-base tracking-wide rounded-md shadow-md flex justify-center items-center text-center cursor-pointer font-hindi-heading"
              disabled={loading}
              isLoading={loading}
            >
              Secure Login
            </AdminButton>
          </form>

          <div className="mt-4 pt-3 sm:mt-6 sm:pt-6 border-t border-gray-100 text-center">
            {isAdminHost() ? (
              <a
                href={getPublicHomeUrl()}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-saffron transition-colors group"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Website</span>
              </a>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-saffron transition-colors group"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Website</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
