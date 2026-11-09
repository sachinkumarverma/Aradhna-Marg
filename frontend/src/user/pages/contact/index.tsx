import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Send,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Phone,
  Heart,
  Globe,
  HelpCircle,
  HandHeart,
  ExternalLink
} from 'lucide-react';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { useTranslation } from '@i18n/LanguageContext';
import { PublicApi } from '@api/publicApi';
import { Select } from '@components/ui/Select';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { SEOHead, buildBreadcrumbSchema } from '@components/seo';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { useUserAuth } from '@/context/UserAuthContext';
import { ENABLE_DONATIONS } from '@/constants';

const formatSocialUrl = (url: string, platform: 'youtube' | 'instagram' | 'facebook' | 'twitter'): string => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const clean = url.trim().replace(/^@/, '');
  switch (platform) {
    case 'youtube':
      return url.trim().startsWith('@') ? `https://youtube.com/${url.trim()}` : `https://youtube.com/@${clean}`;
    case 'instagram':
      return `https://instagram.com/${clean}`;
    case 'facebook':
      return `https://facebook.com/${clean}`;
    case 'twitter':
      return `https://x.com/${clean}`;
  }
};

const extractSocialUsername = (url: string): string => {
  if (!url) return '';
  try {
    let clean = url.trim();
    // If it's already just a username/handle (no slashes, no domain)
    if (!clean.includes('/') && !clean.includes('.')) {
      return clean.replace(/^@+/, '');
    }

    clean = clean.replace(/\/+$/, '');
    let pathname = clean;
    try {
      const parsed = new URL(clean.startsWith('http://') || clean.startsWith('https://') ? clean : `https://${clean}`);
      pathname = parsed.pathname;
    } catch {
      pathname = clean.replace(/^https?:\/\/(www\.)?[^/]+/, '');
    }

    let handle = pathname.replace(/^\/(c\/|user\/|channel\/)?/, '').replace(/^\/+/, '');

    if (handle.includes('/')) {
      handle = handle.split('/')[0];
    }
    if (handle.includes('?')) {
      handle = handle.split('?')[0];
    }

    // Strip leading @ so only the clean username is displayed
    handle = handle.replace(/^@+/, '');

    return handle || url.replace(/^@+/, '');
  } catch {
    return url.replace(/^@+/, '');
  }
};

export const ContactPage: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';
  const { settings } = usePublicSettings();
  const { user, isAuthenticated } = useUserAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState(isHi ? 'सामान्य सुझाव' : 'General Suggestions');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto-fill from authenticated user profile
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, [isAuthenticated, user]);

  const categories = [
    {
      value: isHi ? 'सामान्य सुझाव' : 'General Suggestions',
      label: isHi ? '💡 सामान्य सुझाव (General Suggestions)' : '💡 General Suggestions'
    },
    {
      value: isHi ? 'भजन / ग्रंथ सुधार' : 'Content Correction',
      label: isHi ? '📖 भजन / श्लोक / पाठ सुधार (Content Correction)' : '📖 Content & Lyrics Correction'
    },
    {
      value: isHi ? 'नई सामग्री प्रस्ताव' : 'New Content Request',
      label: isHi ? '✨ नए भजन या ग्रंथ का प्रस्ताव (New Request)' : '✨ New Scripture / Bhajan Request'
    },
    {
      value: isHi ? 'सहयोग एवं सेवा' : 'Collaboration & Seva',
      label: isHi ? '🙏 धर्म सेवा एवं सहयोग (Collaboration)' : '🙏 Devotional Collaboration & Support'
    },
    {
      value: isHi ? 'तकनीकी समस्या' : 'Technical Issue',
      label: isHi ? '⚙️ तकनीकी समस्या / त्रुटि (Technical Issue)' : '⚙️ Technical Issue'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes('@')) {
      toast.error(isHi ? 'कृपया एक मान्य ईमेल पता दर्ज करें।' : 'Please enter a valid email address.');
      return;
    }

    if (!message.trim()) {
      toast.error(isHi ? 'कृपया अपना संदेश या सुझाव लिखें।' : 'Please enter your message or suggestion.');
      return;
    }

    setLoading(true);
    try {
      await PublicApi.submitContact({
        name: name.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        category,
        subject: subject.trim() || category,
        message: message.trim()
      });

      setSubmitted(true);
      toast.success(
        isHi
          ? 'हार्दिक धन्यवाद! आपका संदेश सफलतापूर्वक प्राप्त हो गया है।'
          : 'Thank you! Your message has been successfully received.'
      );
    } catch (err: any) {
      toast.error(
        isHi
          ? `संदेश भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें अथवा सीधे ${settings.contactEmail || 'support@aradhnamarg.com'} पर ईमेल करें।`
          : `Failed to send message. Please try again or email ${settings.contactEmail || 'support@aradhnamarg.com'} directly.`
      );
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = [{ label: isHi ? 'संपर्क एवं सुझाव' : 'Contact & Suggestions' }];
  const breadcrumbs = buildBreadcrumbSchema([
    { name: isHi ? 'मुख्य पृष्ठ' : 'Home', item: '/' },
    { name: isHi ? 'संपर्क' : 'Contact', item: '/contact' }
  ]);

  const pageTitle = isHi ? 'संपर्क एवं सुझाव (Contact Us)' : 'Contact Us & Suggestions';
  const pageDesc = isHi
    ? 'आराधना मार्ग टीम से संपर्क करें, नए भजन या ग्रंथ का सुझाव दें अथवा किसी त्रुटि की सूचना भेजें।'
    : 'Get in touch with Aradhna Marg team, suggest new devotional hymns or scriptures, and send your feedback.';

  return (
    <div
      className={`w-full min-h-screen bg-[#F9F7F3] pt-3 sm:pt-4 pb-24 selection:bg-saffron/20 selection:text-saffron ${isHi ? 'font-hindi-body' : 'font-sans'}`}
    >
      <SEOHead title={pageTitle} description={pageDesc} canonicalPath="/contact" schema={breadcrumbs} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero Section Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#241107] via-[#3a1d0f] to-[#170a04] text-white p-8 sm:p-12 mb-12 shadow-2xl border border-amber-900/40 text-center">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-saffron/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron/20 border border-saffron/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4 ${isHi ? 'font-hindi-body' : 'font-sans'}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-saffron" />
              <span>{isHi ? 'सनातन धर्म सेवा एवं संवाद' : 'Devotional Connect & Support'}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight ${isHi ? 'font-hindi-body' : 'font-sans'}`}
            >
              {isHi ? 'संपर्क एवं पावन सुझाव' : 'Contact & Sacred Suggestions'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-amber-100/90 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-normal ${isHi ? 'font-hindi-body' : 'font-sans'}`}
            >
              {isHi
                ? 'आराधना मार्ग को और अधिक प्रामाणिक व उपयोगी बनाने हेतु अपने विचार, श्लोक सुधार अथवा प्रश्न हमारे साथ साझा करें।'
                : 'Share your valuable suggestions, scripture corrections, or devotional inquiries with the Aradhna Marg team.'}
            </motion.p>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-orange-100/80 shadow-lg">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-darkBrown font-hindi-heading">
                  {isHi ? 'हार्दिक धन्यवाद!' : 'Message Received!'}
                </h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                  {isHi
                    ? 'आपका संदेश सफलतापूर्वक प्राप्त हो गया है। एक पुष्टिकरण ईमेल आपके दिए गए पते पर भेज दिया गया है।'
                    : 'Your message has been sent successfully. A confirmation email has been dispatched to your inbox.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                    setSubject('');
                  }}
                  className="mt-4 px-6 py-2.5 bg-saffron hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all font-hindi-heading"
                >
                  {isHi ? 'नया संदेश भेजें' : 'Send Another Message'}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-saffron font-bold text-sm font-hindi-heading">
                    <MessageSquare className="w-4 h-4" />
                    <span>{isHi ? 'हमें संदेश भेजें' : 'Send Us a Message'}</span>
                  </div>

                  {isAuthenticated && user && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {isHi ? `खाता: ${user.name}` : `Signed in: ${user.name}`}
                    </span>
                  )}
                </div>

                {isAuthenticated && user && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                    <span>
                      ✍️{' '}
                      {isHi
                        ? 'आपके खाते का नाम व ईमेल स्वतः भर दिया गया है।'
                        : 'Your account details have been auto-filled.'}
                    </span>
                  </div>
                )}

                {/* Name & Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-hindi-heading">
                      {isHi ? 'आपका नाम (Name)' : 'Your Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={isHi ? 'उदा. राहुल शर्मा' : 'e.g. Rahul Sharma'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-hindi-heading">
                      {isHi ? 'दूरभाष (Phone Number - ऐच्छिक)' : 'Phone Number (Optional)'}
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Email (Required) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-hindi-heading">
                    {isHi ? 'ईमेल पता (Email Address)' : 'Email Address'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={isHi ? 'अपना ईमेल दर्ज करें...' : 'Enter your email...'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm outline-none transition-all"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-hindi-heading">
                    {isHi ? 'संदेश का विषय / श्रेणी (Category)' : 'Message Category'}
                  </label>
                  <Select
                    options={categories}
                    value={category}
                    onChange={(val) => setCategory(val)}
                    placeholder={isHi ? 'श्रेणी चुनें' : 'Select a category'}
                    searchable={false}
                    className="w-full text-sm"
                  />
                </div>

                {/* Specific Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-hindi-heading">
                    {isHi ? 'शीर्षक (Subject)' : 'Subject'}
                  </label>
                  <input
                    type="text"
                    placeholder={isHi ? 'संदेश का संक्षिप्त शीर्षक...' : 'Brief topic...'}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm outline-none transition-all"
                  />
                </div>

                {/* Message Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-hindi-heading">
                    {isHi ? 'आपका संदेश / सुझाव (Your Message or Suggestion)' : 'Your Message / Suggestion'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder={
                      isHi
                        ? 'कृपया अपना संदेश, सुझाव, अथवा संशोधन विवरण यहाँ विस्तार से लिखें...'
                        : 'Please write your message, feedback, or correction details here...'
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-saffron focus:ring-2 focus:ring-saffron/20 text-sm outline-none transition-all resize-y"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-saffron to-orange-600 hover:from-orange-600 hover:to-saffron text-white font-bold text-base rounded-2xl shadow-lg shadow-saffron/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer font-hindi-heading disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isHi ? 'भेजा जा रहा है...' : 'Sending Message...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      <span>{isHi ? 'संदेश भेजें (Submit Message)' : 'Send Message'}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Contact Details, Social Channels & Support */}
          <div className="lg:col-span-5 space-y-6">
            {/* Direct Email & Contact Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md space-y-4">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-saffron flex items-center justify-center mb-4 border border-amber-200">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-darkBrown font-hindi-heading mb-1">
                  {isHi ? 'सीधा ईमेल संपर्क' : 'Direct Email Support'}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm mb-4 leading-relaxed">
                  {isHi
                    ? 'किसी भी आधिकारिक पूछताछ, ग्रंथ अधिकार अथवा सुझाव हेतु हमें सीधे ईमेल भेज सकते हैं:'
                    : 'For official inquiries, scripture submissions, or copyright queries, contact us directly at:'}
                </p>
                <a
                  href={`mailto:${settings.contactEmail || 'support@aradhnamarg.com'}`}
                  className="inline-flex items-center gap-2 text-saffron hover:text-orange-600 font-bold text-sm bg-amber-50/70 hover:bg-amber-100/70 px-4 py-2.5 rounded-xl border border-amber-200/80 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>{settings.contactEmail || 'support@aradhnamarg.com'}</span>
                </a>
              </div>

              {settings.contactPhone && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-slate-500 font-medium mb-1.5">{isHi ? 'दूरभाष (Phone):' : 'Telephone:'}</p>
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="inline-flex items-center gap-2 text-slate-700 hover:text-saffron font-bold text-sm transition-colors"
                  >
                    <Phone className="w-4 h-4 text-saffron" />
                    <span>{settings.contactPhone}</span>
                  </a>
                </div>
              )}

              {settings.contactAddress && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    {isHi ? 'पता (Address):' : 'Office Address:'}
                  </p>
                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {settings.contactAddress}
                  </p>
                </div>
              )}
            </div>

            {/* Official Social Media Channels */}
            <div className="bg-gradient-to-br from-[#1c0f08] via-[#24130a] to-[#1c0f08] text-white rounded-3xl p-6 sm:p-8 border border-amber-900/40 shadow-xl">
              <div className="flex items-center gap-2 text-saffron text-xs font-bold uppercase tracking-widest mb-2 font-hindi-heading">
                <Globe className="w-4 h-4" />
                <span>{isHi ? 'आधिकारिक डिजिटल चैनल' : 'Official Channels'}</span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                {settings.youtubeUrl && (
                  <a
                    href={formatSocialUrl(settings.youtubeUrl, 'youtube')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-slate-200 group-hover:text-white text-xs sm:text-sm truncate">
                        {extractSocialUsername(settings.youtubeUrl)}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400 transition-colors shrink-0 ml-2" />
                  </a>
                )}

                {settings.instagramUrl && (
                  <a
                    href={formatSocialUrl(settings.instagramUrl, 'instagram')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-pink-600/15 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:via-pink-500 group-hover:to-purple-500 group-hover:text-white transition-all shrink-0">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-slate-200 group-hover:text-white text-xs sm:text-sm truncate">
                        {extractSocialUsername(settings.instagramUrl)}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-pink-400 transition-colors shrink-0 ml-2" />
                  </a>
                )}

                {settings.facebookUrl && (
                  <a
                    href={formatSocialUrl(settings.facebookUrl, 'facebook')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-slate-200 group-hover:text-white text-xs sm:text-sm truncate">
                        {extractSocialUsername(settings.facebookUrl)}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0 ml-2" />
                  </a>
                )}

                {settings.twitterUrl && (
                  <a
                    href={formatSocialUrl(settings.twitterUrl, 'twitter')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-slate-400/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-slate-200 group-hover:bg-white group-hover:text-black transition-colors shrink-0">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-slate-200 group-hover:text-white text-xs sm:text-sm truncate">
                        {extractSocialUsername(settings.twitterUrl)}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors shrink-0 ml-2" />
                  </a>
                )}
              </div>
            </div>

            {/* Support & Donation Card - Hidden until Razorpay approval */}
            {ENABLE_DONATIONS && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border border-orange-200 shadow-sm text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-saffron font-bold text-xs uppercase tracking-wider mb-2 font-hindi-heading">
                  <HandHeart className="w-4 h-4" />
                  <span>{isHi ? 'सहयोग एवं दक्षिणा कोष' : 'Support Our Seva'}</span>
                </div>
                <h4 className="font-black text-darkBrown text-base sm:text-lg mb-2 font-hindi-heading">
                  {isHi ? 'डिजिटल धर्म सेवा में सहयोग करें' : 'Support Devotional Preservation'}
                </h4>
                <p className="text-slate-600 text-xs sm:text-sm mb-4 leading-relaxed">
                  {isHi
                    ? 'महापुराणों एवं पवित्र भजनों के संरक्षण व निःशुल्क प्रसार हेतु ऐच्छिक सहयोग अर्पित करें।'
                    : 'Offer voluntary contribution to help preserve scriptures and provide free access to all devotees.'}
                </p>
                <Link
                  to="/support-us"
                  className="inline-flex items-center justify-center w-full py-3 bg-saffron hover:bg-orange-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all font-hindi-heading"
                >
                  {isHi ? 'सहयोग पृष्ठ पर जाएं' : 'Support Us'}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
