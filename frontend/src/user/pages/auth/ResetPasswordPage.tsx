import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { UserAuthApi } from '@api/userAuth';
import { useTranslation } from '@i18n/LanguageContext';
import { useUserAuth } from '@/context/UserAuthContext';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { SEOHead } from '@components/seo';
import toast from 'react-hot-toast';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isHi = language === 'hi';
  const { openAuthModal } = useUserAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage(
        isHi
          ? 'अमान्य अथवा अनुपस्थित रीसेट टोकन। कृपया ईमेल से पुनः लिंक खोलें।'
          : 'Invalid or missing reset token. Please open the link from your email again.'
      );
      return;
    }

    if (!password || password.length < 6) {
      toast.error(isHi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error(isHi ? 'दोनों पासवर्ड समान नहीं हैं।' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await UserAuthApi.resetPassword(token, password);
      setSuccess(true);
      toast.success(isHi ? 'पासवर्ड सफलतापूर्वक बदल दिया गया है! 🙏' : 'Password has been successfully reset! 🙏');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        (isHi
          ? 'रीसेट लिंक अमान्य है अथवा 15 मिनट की समय-सीमा समाप्त हो चुकी है।'
          : 'Reset token is invalid or expired (15-minute timeline elapsed).');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen lg:h-screen lg:max-h-screen w-full bg-[#0a0f26] lg:bg-[url('/assets/auth/krishna-canvas-backdrop.webp')] bg-cover bg-left-bottom bg-no-repeat text-white flex flex-col justify-between relative overflow-x-hidden lg:overflow-hidden selection:bg-amber-500 selection:text-white">
      <SEOHead
        title={isHi ? 'पासवर्ड रीसेट करें - Aradhna Marg' : 'Reset Password - Aradhna Marg'}
        canonicalPath="/reset-password"
        noIndex={true}
      />

      {/* Atmospheric Mobile Background Gradient */}
      <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#080d22] via-[#0f173b] to-[#120a21] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-30 w-full px-5 sm:px-10 lg:px-14 pt-3.5 sm:pt-4 pb-1 shrink-0 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-[#010243] border border-amber-400/80 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
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
        <div className="flex items-center gap-3">
          <LanguageSwitcher className="bg-white/90 hover:bg-white text-slate-800 border-slate-200 shadow-xs" />
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200/90 shadow-xs transition-all font-sans"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
            <span>{isHi ? 'मुख्य वेबसाइट' : 'Back to Website'}</span>
          </Link>
        </div>
      </header>

      {/* Centered Reset Password Box */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-2 sm:py-4 min-h-0 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[385px] sm:max-w-[395px] w-full bg-white rounded-[26px] sm:rounded-[30px] p-5 sm:p-7 shadow-2xl border border-slate-100/90 text-slate-800 relative z-20"
        >
          {/* Card Top: Golden Om Medallion Flanked by Gold Rules */}
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="h-[1px] w-10 sm:w-12 bg-gradient-to-r from-transparent to-amber-400" />
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-amber-50 to-orange-100/80 border border-amber-300/80 flex items-center justify-center text-amber-700 text-base font-bold shadow-xs">
              ॐ
            </div>
            <div className="h-[1px] w-10 sm:w-12 bg-gradient-to-l from-transparent to-amber-400" />
          </div>

          <h2
            className="text-2xl sm:text-[28px] font-bold text-center text-[#0f172a] tracking-tight mt-1"
            style={{ fontFamily: "'Playfair Display', 'Tiro Devanagari Hindi', Georgia, serif' " }}
          >
            {isHi ? 'नया पासवर्ड निर्धारित करें' : 'Set New Password'}
          </h2>

          <p className="text-xs text-center text-slate-500 font-sans mt-1 mb-5">
            {isHi
              ? 'अपने आराधना मार्ग खाते के लिए एक सुरक्षित नया पासवर्ड चुनें।'
              : 'Choose a strong and secure new password for your Aradhna Marg account.'}
          </p>

          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3
                className="text-lg font-bold text-darkBrown font-serif"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {isHi ? 'पासवर्ड सफलतापूर्वक बदल गया!' : 'Password Reset Successfully!'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {isHi
                  ? 'अब आप अपने नए पासवर्ड के साथ आराधना मार्ग में लॉग इन कर सकते हैं।'
                  : 'You can now sign in to your Aradhna Marg account with your new password.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/auth?mode=login');
                  }}
                  className="w-full h-11.5 rounded-full bg-gradient-to-r from-[#11174b] via-[#1a216a] to-[#2d1b69] text-white font-semibold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{isHi ? 'अब लॉग इन करें' : 'Sign In Now'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 15-Minute Timeline Notice */}
              <div className="p-2.5 bg-amber-50/90 border border-amber-200/90 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <span className="text-sm">⏱️</span>
                <div>
                  <strong>{isHi ? 'सुरक्षा समय-सीमा:' : 'Security Notice:'}</strong>{' '}
                  {isHi
                    ? 'यह रीसेट लिंक केवल 15 मिनट के लिए सक्रिय है।'
                    : 'This reset link remains valid strictly for 15 minutes.'}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1">
                    <p className="font-semibold">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/auth?mode=forgot');
                      }}
                      className="mt-1.5 inline-block text-amber-700 hover:underline font-bold"
                    >
                      {isHi ? 'नया लिंक मंगाएं ➜' : 'Request a new link ➜'}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 font-sans">
                  {isHi ? 'नया पासवर्ड (New Password)' : 'New Password'}
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none stroke-[1.5]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full h-12 pl-12 pr-12 text-sm text-slate-800 rounded-xl border border-slate-200/90 bg-white focus:border-[#171c54] focus:ring-2 focus:ring-[#171c54]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 stroke-[1.5]" />
                    ) : (
                      <Eye className="w-5 h-5 stroke-[1.5]" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 font-sans">
                  {isHi ? 'पासवर्ड की पुष्टि (Confirm Password)' : 'Confirm Password'}
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none stroke-[1.5]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full h-12 pl-12 pr-12 text-sm text-slate-800 rounded-xl border border-slate-200/90 bg-white focus:border-[#171c54] focus:ring-2 focus:ring-[#171c54]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-gradient-to-r from-[#11174b] via-[#1a216a] to-[#2d1b69] hover:brightness-110 active:scale-[0.99] text-white text-sm font-semibold tracking-wide shadow-md shadow-indigo-950/25 flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin text-amber-300" />}
                <span>{isHi ? 'पासवर्ड सहेजें' : 'Update Password'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> {isHi ? 'मुख्य पृष्ठ पर लौटें' : 'Back to Home'}
                </Link>
              </div>

              {/* Bottom Lotus Ornament */}
              <div className="flex items-center justify-center gap-3 mt-5 pt-1">
                <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-r from-transparent to-amber-300/80" />
                <span className="text-amber-600/90 text-sm select-none">🪷</span>
                <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-l from-transparent to-amber-300/80" />
              </div>
            </form>
          )}
        </motion.div>
      </main>

      {/* Devotional Footer */}
      <footer className="relative z-30 w-full py-3.5 px-6 text-center text-xs text-amber-100/60 font-sans">
        © {new Date().getFullYear()} Aradhna Marg (आराधना मार्ग) •{' '}
        {isHi ? 'सनातन धर्म सेवा • सर्वाधिकार सुरक्षित' : 'Sanatan Dharma Seva • All Rights Reserved'}
      </footer>
    </div>
  );
};
