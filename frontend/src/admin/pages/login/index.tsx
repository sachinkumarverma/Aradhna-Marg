import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login, adminGoogleLogin, isAuthenticated, clearSession } from '@api/auth';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Loader2, Lock, Eye, EyeOff, ArrowLeft, User } from 'lucide-react';
import { CustomLoader } from '@components/common/CustomLoader';
import { SEOHead } from '@components/seo';
import { getAdminPath, getPublicHomeUrl, isAdminHost } from '@utils/host';

export const AdminLogin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // If user passed ?force=true or ?logout=true, clear session and show login form
    if (searchParams.get('force') === 'true' || searchParams.get('logout') === 'true') {
      clearSession();
      setCheckingAuth(false);
      return;
    }

    // If already logged in, redirect to dashboard
    if (isAuthenticated()) {
      navigate(getAdminPath('/dashboard'), { replace: true });
    } else {
      setCheckingAuth(false);
    }
  }, [navigate, searchParams]);

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

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    setError('');
    try {
      await adminGoogleLogin(credential);
      navigate(getAdminPath('/dashboard'), { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Google authorization failed');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0f26]">
        <CustomLoader fullScreen={false} text="Checking administrative access..." />
      </div>
    );
  }

  return (
    <div
      className="admin-login-page min-h-screen md:h-screen md:max-h-screen w-full bg-[#0a0f26] text-white flex flex-col justify-between relative overflow-x-hidden md:overflow-hidden selection:bg-amber-500 selection:text-white"
      style={{
        backgroundImage: `url('/assets/auth/krishna-admin-backdrop.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'left top',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <SEOHead title="Admin Portal Login - Aradhna Marg" canonicalPath={getAdminPath('/login')} noIndex={true} />

      {/* Top Floating Bar: Logo on left with black "ARADHNA" text */}
      <header className="relative z-30 w-full px-6 sm:px-10 md:px-14 lg:px-16 pt-3 sm:pt-4 pb-2 sm:pb-3 flex items-center justify-between pointer-events-none">
        {isAdminHost() ? (
          <a href={getPublicHomeUrl()} className="flex items-center gap-3 group pointer-events-auto shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-white border-2 border-orange-500/90 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
              <img src="/logo.png" alt="Aradhna Marg Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col justify-center">
              <span
                className="font-serif font-black text-base sm:text-lg tracking-[0.14em] text-black leading-none uppercase drop-shadow-sm font-playfair-bold"
                style={{ fontFamily: "'Playfair Display', Lora, Georgia, serif" }}
              >
                ARADHNA <span className="text-orange-600">MARG</span>
              </span>
              <div className="h-[1.5px] w-14 sm:w-16 bg-gradient-to-r from-orange-600 to-transparent mt-1" />
            </div>
          </a>
        ) : (
          <Link to="/" className="flex items-center gap-3 group pointer-events-auto shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-white border-2 border-orange-500/90 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
              <img src="/logo.png" alt="Aradhna Marg Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col justify-center">
              <span
                className="font-serif font-black text-base sm:text-lg tracking-[0.14em] text-black leading-none uppercase drop-shadow-sm font-playfair-bold"
                style={{ fontFamily: "'Playfair Display', Lora, Georgia, serif" }}
              >
                ARADHNA <span className="text-orange-600">MARG</span>
              </span>
              <div className="h-[1.5px] w-14 sm:w-16 bg-gradient-to-r from-orange-600 to-transparent mt-1" />
            </div>
          </Link>
        )}
      </header>

      {/* Main Workspace: Clean Lord Krishna background with Auth Card on right */}
      <main className="relative z-20 flex-1 max-w-[1440px] w-full mx-auto px-6 sm:px-10 md:px-14 lg:px-16 pt-2 pb-8 flex items-center justify-center md:justify-end min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-[420px] sm:max-w-[430px] bg-white rounded-[26px] p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-slate-100/90 text-slate-800 relative z-20 -translate-y-4 sm:-translate-y-6 md:-translate-y-8"
        >
          {/* Card Top: Golden Om Medallion Flanked by Gold Rules */}
          <div className="flex items-center justify-center gap-2.5 mt-1 mb-1.5">
            <div className="h-[1px] w-10 sm:w-12 bg-gradient-to-r from-transparent to-amber-400" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#fffbeb] to-[#fef3c7] border border-amber-300/80 flex items-center justify-center text-amber-700 text-sm font-bold leading-none shadow-xs">
              <span className="inline-flex items-center justify-center leading-none translate-y-[3px]">ॐ</span>
            </div>
            <div className="h-[1px] w-10 sm:w-12 bg-gradient-to-l from-transparent to-amber-400" />
          </div>

          {/* Card Headline: Playfair Display */}
          <h2
            className="text-[24px] sm:text-[26px] lg:text-[28px] font-bold text-center text-[#0f172a] tracking-tight mt-1 mb-1 leading-tight font-playfair-bold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            Admin Access
          </h2>
          <p className="text-xs sm:text-[13px] text-center text-gray-500 mb-4 sm:mb-5">
            Sign in to access the platform management console
          </p>

          {/* Google Sign-in Button prominent at top */}
          <div className="mb-4">
            <GoogleAuthButton
              label="Sign in with Google"
              text="signin_with"
              onSuccess={handleGoogleSuccess}
              onError={(err) => setError(err)}
              disabled={loading}
            />
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2.5 text-gray-400 font-semibold text-[11px]">
                Or continue with credentials
              </span>
            </div>
          </div>

          {/* Username & Password Form */}
          <form onSubmit={handleLogin} className="space-y-3.5 pt-0.5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-800 mb-1.5 font-sans">
                Username / Email
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[1.5]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin@aradhnamarg.com"
                  className="w-full h-11 pl-10 pr-3 text-sm text-slate-800 rounded-xl border border-slate-200/90 bg-white focus:border-[#171c54] focus:ring-2 focus:ring-[#171c54]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-800 mb-1.5 font-sans">Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[1.5]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 text-sm text-slate-800 rounded-xl border border-slate-200/90 bg-white focus:border-[#171c54] focus:ring-2 focus:ring-[#171c54]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md cursor-pointer focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium text-center">
                {error}
              </div>
            )}

            {/* Submit Button in Warm Saffron / Orange */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 min-h-[48px] bg-gradient-to-r from-[#ff5722] via-[#ff3b00] to-[#e63500] hover:brightness-110 active:scale-[0.99] text-white font-bold text-sm sm:text-[15px] tracking-wide rounded-xl shadow-md shadow-[#ff3b00]/25 flex justify-center items-center cursor-pointer transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              <div className="flex items-center justify-center gap-2 translate-y-[2px]">
                {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                <span>Secure Login →</span>
              </div>
            </button>
          </form>

          {/* Bottom Return Link */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            {isAdminHost() ? (
              <a
                href={getPublicHomeUrl()}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-700 transition-colors group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Public Website</span>
              </a>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-700 transition-colors group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Public Website</span>
              </Link>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};
