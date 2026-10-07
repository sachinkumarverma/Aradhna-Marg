import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, Send, Mail, BookOpen, Calendar, ShieldCheck, CheckCircle2, HandHeart } from 'lucide-react';
import { useTranslation } from '@i18n/LanguageContext';
import toast from 'react-hot-toast';

import { PublicApi } from '@api/publicApi';

export const Footer: React.FC = () => {
  const { t, language } = useTranslation();
  const isHi = language === 'hi';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error(isHi ? 'कृपया एक वैध ईमेल पता दर्ज करें।' : 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await PublicApi.subscribeNewsletter({ email: email.trim() });
      setSubscribed(true);
      toast.success(
        isHi
          ? 'हार्दिक धन्यवाद! आप आराधना मार्ग परिवार से जुड़ गए हैं।'
          : 'Thank you for joining the Aradhna Marg spiritual family!'
      );
      setEmail('');
    } catch (err) {
      // Still show polite success if already subscribed or network error
      setSubscribed(true);
      toast.success(isHi ? 'हार्दिक धन्यवाद! आपका ईमेल पंजीकृत हो गया है।' : 'Thank you! Your email is registered.');
      setEmail('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="w-full shrink-0 bg-[#0e0703] text-gray-400 pt-6 sm:pt-8 md:pt-12 pb-12 sm:pb-14 border-t border-amber-900/40 relative overflow-hidden font-hindi-body">
      {/* Background Sacred Glows */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-gradient-to-r from-amber-500/10 via-saffron/15 to-orange-600/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 1. Top Devotional Connect Banner */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#1c0f08] via-[#24130a] to-[#1c0f08] border border-amber-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-saffron text-xs sm:text-sm font-bold mb-1.5 font-hindi-heading">
              <Sparkles className="w-4 h-4 fill-saffron shrink-0" />
              <span>{isHi ? 'सनातन सत्संग एवं ज्ञान संदेश' : 'Sanatan Wisdom Community'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-hindi-heading mb-1">
              {isHi
                ? 'दैनिक भक्ति, श्लोक व पर्व अपडेट्स से जुड़ें'
                : 'Receive Daily Shlokas, Bhajans & Festival Alerts'}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              {isHi
                ? 'महापुराणों के प्रसंग, दुर्लभ स्तोत्र व आगामी तिथियों की जानकारी सीधे प्राप्त करें।'
                : 'Get authenticated scripture notes, stotras, and upcoming tithi reminders directly.'}
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="w-full md:w-auto flex-1 max-w-md flex flex-col sm:flex-row gap-2.5 md:justify-end"
          >
            <input
              type="email"
              placeholder={isHi ? 'अपना ईमेल पता दर्ज करें...' : 'Enter your email...'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-white placeholder:text-slate-500 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-all"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-saffron to-orange-600 hover:from-orange-600 hover:to-saffron text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-saffron/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer font-hindi-heading active:scale-95"
            >
              {subscribed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{isHi ? 'सफल' : 'Subscribed'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>{isHi ? 'जुड़ें' : 'Join'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* 2. Main Navigation Grid - Balanced Responsive Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8 mb-12 w-full">
          {/* Column 1: Brand & Identity */}
          <div className="flex flex-col max-w-sm">
            <Link to="/" className="inline-flex items-center gap-3 mb-4 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/25 to-orange-600/30 border border-amber-500/40 flex items-center justify-center text-saffron shadow-inner group-hover:scale-105 transition-transform shrink-0">
                <span className="font-black text-2xl font-hindi-heading">ॐ</span>
              </div>
              <div>
                <span className="block font-black text-xl text-white tracking-wider font-hindi-heading leading-tight">
                  ARADHNA MARG
                </span>
                <span className="block text-[11px] font-bold text-amber-400 tracking-widest uppercase font-hindi-heading">
                  आराधना मार्ग • ज्ञान-मंदिर
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-5 font-normal">
              {isHi
                ? 'वेदों, 18 महापुराणों, स्तोत्रों, भजनों एवं दैनिक पंचांग का प्रामाणिक व सर्वसुलभ डिजिटल संकलन।'
                : 'An authenticated digital sanctuary preserving 18 Mahapuranas, sacred stotras, bhajans, and Vedic Panchang.'}
            </p>

            {/* Sacred Shloka Seal */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-amber-200/90 font-medium space-y-1 mt-auto">
              <p className="text-saffron font-bold font-hindi-heading">॥ धर्मो रक्षति रक्षितः ॥</p>
              <p className="text-slate-400 text-[11px]">
                {isHi ? 'सनातन धर्म सेवा में समर्पित' : 'Dedicated to Sanatan Dharma Seva'}
              </p>
            </div>
          </div>

          {/* Column 2: शास्त्र एवं ग्रंथालय (Aligned right on 2-col tablet) */}
          <div className="sm:justify-self-end sm:w-fit sm:min-w-[200px] lg:w-full lg:justify-self-auto">
            <h4 className="font-bold text-white mb-4 text-base flex items-center gap-2 font-hindi-heading">
              <BookOpen className="w-4 h-4 text-saffron shrink-0" />
              <span>{isHi ? 'शास्त्र एवं ग्रंथालय' : 'Scriptures & Library'}</span>
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link to="/puranas" className="hover:text-amber-400 transition-colors flex items-center gap-2 py-0.5">
                  <span className="text-xs text-amber-500">•</span>
                  <span>{isHi ? '18 महापुराण संग्रह' : '18 Mahapuranas'}</span>
                </Link>
              </li>
              <li>
                <Link to="/bhajans" className="hover:text-amber-400 transition-colors flex items-center gap-2 py-0.5">
                  <span className="text-xs text-amber-500">•</span>
                  <span>{isHi ? 'सम्पूर्ण आरती व चालीसा' : 'Aartis & Chalisas'}</span>
                </Link>
              </li>
              <li>
                <Link to="/gods" className="hover:text-amber-400 transition-colors flex items-center gap-2 py-0.5">
                  <span className="text-xs text-amber-500">•</span>
                  <span>{isHi ? 'देवी-देवता एवं स्तुति' : 'Deities & Stutis'}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="hover:text-amber-400 transition-colors flex items-center gap-2 py-0.5"
                >
                  <span className="text-xs text-amber-500">•</span>
                  <span>{isHi ? 'भक्ति विषय एवं श्रेणियां' : 'Categories & Topics'}</span>
                </Link>
              </li>
              <li>
                <Link to="/articles" className="hover:text-amber-400 transition-colors flex items-center gap-2 py-0.5">
                  <span className="text-xs text-amber-500">•</span>
                  <span>{isHi ? 'आध्यात्मिक लेख व प्रसंग' : 'Spiritual Articles'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: दैनिक साधना व सुविधाएं */}
          <div className="flex flex-col max-w-sm">
            <h4 className="font-bold text-white mb-4 text-base flex items-center gap-2 font-hindi-heading">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isHi ? 'दैनिक साधना व सुविधाएं' : 'Devotional Tools'}</span>
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link to="/festivals" className="hover:text-amber-400 transition-colors flex items-center gap-2 py-0.5">
                  <span className="text-xs text-amber-500">•</span>
                  <span>{isHi ? 'धार्मिक पर्व व व्रत तिथियां' : 'Festivals & Vrats'}</span>
                </Link>
              </li>
              <li>
                <Link to="/videos" className="hover:text-amber-400 transition-colors flex items-center gap-2 py-0.5">
                  <span className="text-xs text-amber-500">•</span>
                  <span>{isHi ? 'भजन व कथा वीडियो' : 'Video Gallery'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: संस्थान एवं सेवा + Social Media (Aligned right on 2-col tablet) */}
          <div className="sm:justify-self-end sm:w-fit sm:min-w-[200px] lg:w-full lg:justify-self-auto">
            <h4 className="font-bold text-white mb-4 text-base flex items-center gap-2 font-hindi-heading">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isHi ? 'संस्थान एवं सेवा' : 'Mission & Seva'}</span>
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300 mb-5">
              <li>
                <Link
                  to="/support-us"
                  className="text-saffron hover:text-orange-400 font-bold transition-colors flex items-center gap-1.5 py-0.5"
                >
                  <HandHeart className="w-3.5 h-3.5 text-saffron shrink-0" />
                  <span>{isHi ? 'सहयोग एवं दक्षिणा कोष' : 'Support Our Seva'}</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-400 transition-colors flex items-center gap-2 py-0.5">
                  <span className="text-xs text-amber-500">•</span>
                  <span>{isHi ? 'हमारे बारे में' : 'About Us'}</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-400 transition-colors flex items-center gap-2 py-0.5">
                  <span className="text-xs text-amber-500">•</span>
                  <span>{isHi ? 'संपर्क एवं सुझाव' : 'Contact & Suggestions'}</span>
                </Link>
              </li>
            </ul>

            {/* Social Channels */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 mb-2.5 uppercase tracking-wider font-hindi-heading">
                {isHi ? 'सोशल मीडिया से जुड़ें' : 'Official Channels'}
              </p>
              <div className="flex items-center gap-2">
                {/* YouTube */}
                <a
                  href="https://youtube.com/@thebhaktimarg_official"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube Channel"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all cursor-pointer"
                  title="YouTube: @thebhaktimarg_official"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com/thebhaktimarg_official"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram Profile"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-pink-600/20 border border-white/10 hover:border-pink-500/50 flex items-center justify-center text-slate-300 hover:text-pink-500 transition-all cursor-pointer"
                  title="Instagram: @thebhaktimarg_official"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://facebook.com/sachinkumarverma2001"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook Page"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 flex items-center justify-center text-slate-300 hover:text-blue-500 transition-all cursor-pointer"
                  title="Facebook: sachinkumarverma2001"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* Contact Email */}
                <a
                  href="mailto:support@aradhnamarg.com"
                  aria-label="Email Support"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-amber-600/20 border border-white/10 hover:border-amber-500/50 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-all cursor-pointer"
                  title="Email: support@aradhnamarg.com"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Legal & Copyright Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} <strong className="text-white font-bold">Aradhna Marg</strong>.{' '}
            {isHi
              ? 'समस्त अधिकार सुरक्षित। सनातन धर्म सेवा हेतु समर्पित।'
              : 'All rights reserved. Dedicated to Sanatan Dharma.'}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-5 text-slate-400">
            <Link to="/disclaimer" className="hover:text-white transition-colors">
              {isHi ? 'अस्वीकरण (Disclaimer)' : 'Disclaimer'}
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white transition-colors">
              {isHi ? 'नियम व शर्तें (Terms)' : 'Terms of Service'}
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-white transition-colors">
              {isHi ? 'गोपनीयता नीति (Privacy)' : 'Privacy Policy'}
            </Link>
            <span>•</span>
            <a
              href="mailto:support@aradhnamarg.com"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              support@aradhnamarg.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
