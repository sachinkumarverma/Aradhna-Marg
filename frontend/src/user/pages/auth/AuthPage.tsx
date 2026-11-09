import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Heart,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  BookOpen,
  Music
} from 'lucide-react';
import { useUserAuth } from '@/context/UserAuthContext';
import { GoogleAuthButton } from '@components/auth/GoogleAuthButton';
import { UserAuthApi } from '@api/userAuth';
import { SEOHead } from '@components/seo';
import toast from 'react-hot-toast';

export const AuthPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { isAuthenticated, login, signup, googleAuth } = useUserAuth();

  // URL Query Parameters
  const initialMode = (searchParams.get('mode') as 'login' | 'signup' | 'forgot') || 'login';
  const redirectUrl = searchParams.get('redirect') || '/';
  const reason = searchParams.get('reason') || '';

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);

  // Sync mode with URL if changed externally
  useEffect(() => {
    const qMode = searchParams.get('mode');
    if (qMode === 'signup' || qMode === 'forgot' || qMode === 'login') {
      setMode(qMode);
    }
  }, [searchParams]);

  // If already authenticated, redirect to target
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectUrl]);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const switchMode = (newMode: 'login' | 'signup' | 'forgot') => {
    setMode(newMode);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('mode', newMode);
    setSearchParams(newParams, { replace: true });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate(redirectUrl, { replace: true });
    } catch {
      // toast shown in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signup(name, email, password);
      navigate(redirectUrl, { replace: true });
    } catch {
      // toast handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credential: string, gMode: 'login' | 'signup') => {
    setSubmitting(true);
    try {
      await googleAuth(credential, gMode);
      navigate(redirectUrl, { replace: true });
    } catch {
      // toast handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter your registered email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await UserAuthApi.forgotPassword(email);
      setForgotSent(true);
      toast.success(res.message || 'Password reset link dispatched.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle = mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Reset Password';

  return (
    <div
      className="auth-page min-h-screen lg:h-screen lg:max-h-screen w-full bg-[#0a0f26] lg:bg-[url('/assets/auth/krishna-canvas-backdrop.webp')] bg-cover bg-left-bottom bg-local bg-no-repeat text-white flex flex-col justify-between relative overflow-x-hidden lg:overflow-hidden selection:bg-amber-500 selection:text-white"
      style={{ backgroundPosition: 'left bottom', backgroundAttachment: 'local' }}
    >
      <SEOHead
        title={`${pageTitle} - Aradhna Marg`}
        description="Sign in or create an account on Aradhna Marg to sync your favorite devotional songs and scriptures."
        canonicalPath="/auth"
        noIndex={true}
      />

      {/* Atmospheric Mobile Background Gradient (only on small screens where desktop backdrop is hidden) */}
      <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#080d22] via-[#0f173b] to-[#120a21] pointer-events-none" />

      {/* Top Floating Bar: Logo on left, no right buttons */}
      <div className="relative z-30 w-full px-6 sm:px-10 lg:px-16 pt-3 sm:pt-4 pb-2 sm:pb-3 flex items-center justify-between pointer-events-none">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 group pointer-events-auto shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-[#041a4b] border-2 border-amber-400/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
            <img src="/logo.png" alt="Aradhna Marg Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <span
              className="font-black text-base sm:text-[19px] tracking-[0.1em] text-white leading-none uppercase font-sans drop-shadow-sm"
              style={{
                fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 900
              }}
            >
              ARADHNA <span className="text-amber-400 font-black">MARG</span>
            </span>
            <div className="h-[2px] w-14 sm:w-16 bg-gradient-to-r from-amber-400 to-transparent mt-1 rounded-full" />
          </div>
        </Link>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <main className="relative z-20 flex-1 max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-16 pt-8 pb-8 lg:pt-0 lg:pb-0 flex items-stretch min-h-0 lg:h-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-start lg:h-full">
          {/* Left Column: Headline and subhead in English (anchored slightly up so it never overlaps Krishna) */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-start lg:self-start lg:pt-[clamp(5rem,15.5vh,7rem)] space-y-4 sm:space-y-5 max-w-[520px]">
            {/* Punch Headline: Playfair Display Bold */}
            <h1
              className="text-4xl sm:text-[44px] lg:text-[52px] xl:text-[58px] font-bold text-white leading-[1.08] tracking-tight drop-shadow-md font-playfair-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
            >
              A sacred space{' '}
              <span
                className="block text-transparent bg-clip-text bg-gradient-to-r from-[#fde68a] via-[#f59e0b] to-[#fbbf24] drop-shadow-[0_2px_15px_rgba(245,158,11,0.35)] mt-1 font-playfair-bold"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
              >
                for devotion
              </span>
            </h1>

            {/* Devotional Subtitle: breaks into 2 natural lines */}
            <p className="text-slate-200/90 text-sm sm:text-[15px] leading-relaxed max-w-[340px] font-sans">
              Listen, read, and return to the wisdom that grounds your day.
            </p>

            {/* Pillar Line: Clean icons + text separated by | */}
            <div className="flex items-center flex-wrap gap-y-2 text-xs sm:text-sm text-white/90 font-medium pt-2">
              <span className="inline-flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={2.2} />
                <span>Bhajans</span>
              </span>
              <span className="text-white/30 font-light mx-3 select-none">|</span>
              <span className="inline-flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={2.2} />
                <span>Scriptures</span>
              </span>
              <span className="text-white/30 font-light mx-3 select-none">|</span>
              <span className="inline-flex items-center gap-2">
                <span className="text-base text-amber-400 select-none leading-none">🪔</span>
                <span>Daily Aarti</span>
              </span>
            </div>
          </div>

          {/* Right Column: The White Auth Card (vertically centered) */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end items-center lg:self-stretch">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`auth-card auth-card-${mode} w-full max-w-[425px] sm:max-w-[435px] bg-white rounded-[28px] p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100/90 text-slate-800 relative z-20 ${mode === 'forgot' ? 'lg:min-h-[368px] flex flex-col' : ''}`}
            >
              {/* Card Top: Golden Om Medallion Flanked by Gold Rules */}
              <div className="flex items-center justify-center gap-2.5 mt-1 mb-1.5">
                <div className="h-[1px] w-10 sm:w-12 bg-gradient-to-r from-transparent to-amber-400" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#fffbeb] to-[#fef3c7] border border-amber-300/80 flex items-center justify-center text-amber-700 text-sm font-bold leading-none shadow-xs">
                  <span className="inline-flex items-center justify-center leading-none translate-y-[1px]">ॐ</span>
                </div>
                <div className="h-[1px] w-10 sm:w-12 bg-gradient-to-l from-transparent to-amber-400" />
              </div>

              {/* Card Headline: Playfair Display */}
              <h2
                className="auth-card-title text-[28px] sm:text-[30px] lg:text-[32px] font-bold text-center text-[#0f172a] tracking-tight mt-1 mb-5 leading-tight font-playfair-bold translate-y-px"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
              >
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Create an Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>

              {/* Optional Context Reason Notice (e.g. from Wishlist redirect) */}
              {reason && (
                <div className="mt-3 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs flex items-center justify-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                  <span>{reason}</span>
                </div>
              )}

              {/* Mode Toggle Tabs (Sign In / Sign Up) */}
              {mode !== 'forgot' && (
                <div className="auth-card-tabs w-full bg-[#f1f3f9] p-1 rounded-xl flex items-center mt-5 mb-3.5 border border-slate-100">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`flex-1 py-2 text-sm font-semibold leading-none rounded-lg transition-all cursor-pointer ${
                      mode === 'login'
                        ? 'bg-gradient-to-r from-[#171c54] via-[#1c2266] to-[#252277] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span className="inline-block -translate-y-px">Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className={`flex-1 py-2 text-sm font-semibold leading-none rounded-lg transition-all cursor-pointer ${
                      mode === 'signup'
                        ? 'bg-gradient-to-r from-[#171c54] via-[#1c2266] to-[#252277] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span className="inline-block -translate-y-px">Sign Up</span>
                  </button>
                </div>
              )}

              {/* 1. LOGIN FORM */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="auth-card-form space-y-3.5 sm:space-y-4 pt-1">
                  {/* Google Sign-in Button */}
                  <GoogleAuthButton
                    label="Sign in with Google"
                    text="signin_with"
                    onSuccess={(cred) => handleGoogleSuccess(cred, 'login')}
                    disabled={submitting}
                  />

                  {/* Email Field */}
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-1.5 font-sans">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[1.5]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="user@example.com"
                        className="w-full h-10 pl-10 pr-3 text-sm text-slate-800 rounded-xl border border-slate-200/90 bg-white focus:border-[#171c54] focus:ring-2 focus:ring-[#171c54]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs font-sans"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[13px] font-semibold text-slate-800 font-sans">Password</label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-amber-700 hover:text-amber-800 hover:underline font-medium cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[1.5]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full h-10 pl-10 pr-10 text-sm text-slate-800 rounded-xl border border-slate-200/90 bg-white focus:border-[#171c54] focus:ring-2 focus:ring-[#171c54]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer p-1 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 stroke-[1.5]" />
                        ) : (
                          <Eye className="w-4 h-4 stroke-[1.5]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Primary CTA Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10 rounded-full bg-gradient-to-r from-[#11174b] via-[#1a216a] to-[#2d1b69] hover:brightness-110 active:scale-[0.99] text-white text-sm font-semibold tracking-wide shadow-md shadow-indigo-950/25 flex items-center justify-center transition-all !mt-4 sm:!mt-5 cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center justify-center gap-2 -translate-y-px">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin text-amber-300" />}
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
                    </div>
                  </button>

                  {/* Bottom Lotus Ornament */}
                  <div className="flex items-center justify-center gap-2.5 !mt-3.5 pt-1">
                    <div className="h-[1px] w-10 sm:w-12 bg-gradient-to-r from-transparent to-amber-300/80" />
                    <span className="text-amber-600/90 text-xs select-none">🪷</span>
                    <div className="h-[1px] w-10 sm:w-12 bg-gradient-to-l from-transparent to-amber-300/80" />
                  </div>
                </form>
              )}

              {/* 2. SIGNUP FORM */}
              {mode === 'signup' && (
                <form onSubmit={handleSignupSubmit} className="auth-card-form space-y-3.5 sm:space-y-4 pt-1">
                  {/* Google Sign-in for New User */}
                  <GoogleAuthButton
                    label="Sign up with Google"
                    text="signup_with"
                    onSuccess={(cred) => handleGoogleSuccess(cred, 'signup')}
                    disabled={submitting}
                  />

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-1.5 font-sans">Full Name</label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[1.5]" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g. Ramesh Sharma"
                        className="w-full h-10 pl-10 pr-3 text-sm text-slate-800 rounded-xl border border-slate-200/90 bg-white focus:border-[#171c54] focus:ring-2 focus:ring-[#171c54]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-1.5 font-sans">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[1.5]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="user@example.com"
                        className="w-full h-10 pl-10 pr-3 text-sm text-slate-800 rounded-xl border border-slate-200/90 bg-white focus:border-[#171c54] focus:ring-2 focus:ring-[#171c54]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs font-sans"
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
                        className="w-full h-10 pl-10 pr-10 text-sm text-slate-800 rounded-xl border border-slate-200/90 bg-white focus:border-[#171c54] focus:ring-2 focus:ring-[#171c54]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer p-1 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 stroke-[1.5]" />
                        ) : (
                          <Eye className="w-4 h-4 stroke-[1.5]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-slate-800 mb-1.5 font-sans">
                      Confirm Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[1.5]" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full h-10 pl-10 pr-10 text-sm text-slate-800 rounded-xl border border-slate-200/90 bg-white focus:border-[#171c54] focus:ring-2 focus:ring-[#171c54]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer p-1 transition-colors"
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 stroke-[1.5]" />
                        ) : (
                          <Eye className="w-4 h-4 stroke-[1.5]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10 rounded-full bg-gradient-to-r from-[#11174b] via-[#1a216a] to-[#2d1b69] hover:brightness-110 active:scale-[0.99] text-white text-sm font-semibold tracking-wide shadow-md shadow-indigo-950/25 flex items-center justify-center transition-all !mt-4 sm:!mt-5 cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center justify-center gap-2 -translate-y-px">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin text-amber-300" />}
                      <span>Sign Up</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
                    </div>
                  </button>

                  {/* Bottom Lotus Ornament */}
                  <div className="flex items-center justify-center gap-2.5 !mt-3.5 pt-1">
                    <div className="h-[1px] w-10 sm:w-12 bg-gradient-to-r from-transparent to-amber-300/80" />
                    <span className="text-amber-600/90 text-xs select-none">🪷</span>
                    <div className="h-[1px] w-10 sm:w-12 bg-gradient-to-l from-transparent to-amber-300/80" />
                  </div>
                </form>
              )}

              {/* 3. FORGOT PASSWORD FLOW */}
              {mode === 'forgot' && (
                <div className="pt-1 flex-1 flex flex-col justify-center">
                  {forgotSent ? (
                    <div className="text-center py-3 space-y-3">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 font-serif">Reset Link Sent!</h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">
                        We have dispatched a password reset link to your registered email address.
                      </p>
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed font-sans">
                        ⏱️ <strong>Notice:</strong> This link will strictly expire after 15 minutes.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotSent(false);
                          switchMode('login');
                        }}
                        className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                      >
                        Return to Sign In
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} className="auth-card-form space-y-2.5">
                      <div>
                        <label className="block text-[13px] font-semibold text-slate-800 mb-1 font-sans">
                          Email Address
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none stroke-[1.5]" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="user@example.com"
                            className="w-full h-10 pl-10 pr-3 text-sm text-slate-800 rounded-xl border border-slate-200/90 bg-white focus:border-[#171c54] focus:ring-2 focus:ring-[#171c54]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs font-sans"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-10 rounded-full bg-gradient-to-r from-[#11174b] via-[#1a216a] to-[#2d1b69] hover:brightness-110 active:scale-[0.99] text-white text-sm font-semibold tracking-wide shadow-md shadow-indigo-950/25 flex items-center justify-center transition-all mt-2 cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center justify-center gap-2 -translate-y-px">
                          {submitting && <Loader2 className="w-4 h-4 animate-spin text-amber-300" />}
                          <span>Send Reset Link</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
                        </div>
                      </button>

                      <div className="text-center pt-5">
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                        </button>
                      </div>

                      {/* Bottom Lotus Ornament */}
                      <div className="flex items-center justify-center mt-1">
                        <div className="h-[1px] w-10 sm:w-12 bg-gradient-to-r from-transparent to-amber-300/80" />
                        <span className="text-amber-600/90 text-xs select-none">🪷</span>
                        <div className="h-[1px] w-10 sm:w-12 bg-gradient-to-l from-transparent to-amber-300/80" />
                      </div>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Devotional Sub-footer */}
      <footer className="relative z-30 w-full py-2.5 px-6 lg:px-16 text-center lg:text-left text-[11px] text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] font-sans shrink-0">
        © {new Date().getFullYear()} Aradhna Marg • Dedicated to Sanatan Dharma • All Rights Reserved
      </footer>
    </div>
  );
};
