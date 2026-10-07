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
  HandHeart
} from 'lucide-react';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { useTranslation } from '@i18n/LanguageContext';
import { PublicApi } from '@api/publicApi';
import { Select } from '@components/ui/Select';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const ContactPage: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState(isHi ? 'सामान्य सुझाव' : 'General Suggestions');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = isHi
      ? 'संपर्क एवं सुझाव (Contact & Suggestions) | आराधना मार्ग - Aradhna Marg'
      : 'Contact & Suggestions | Aradhna Marg';
  }, [isHi]);

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
          ? 'संदेश भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें अथवा सीधे support@aradhnamarg.com पर ईमेल करें।'
          : 'Failed to send message. Please try again or email support@aradhnamarg.com directly.'
      );
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = [{ label: isHi ? 'संपर्क एवं सुझाव' : 'Contact & Suggestions' }];

  return (
    <div
      className={`w-full min-h-screen bg-[#F9F7F3] pt-8 pb-24 selection:bg-saffron/20 selection:text-saffron ${isHi ? 'font-hindi-body' : 'font-sans'}`}
    >
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
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron/20 border border-saffron/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4 font-hindi-heading"
            >
              <Sparkles className="w-3.5 h-3.5 text-saffron" />
              <span>{isHi ? 'सनातन धर्म सेवा एवं संवाद' : 'Devotional Connect & Support'}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight font-hindi-heading leading-tight"
            >
              {isHi ? 'संपर्क एवं पावन सुझाव' : 'Contact & Sacred Suggestions'}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-amber-100/80 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
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
                <div className="flex items-center gap-2 text-saffron font-bold text-sm mb-2 font-hindi-heading">
                  <MessageSquare className="w-4 h-4" />
                  <span>{isHi ? 'हमें संदेश भेजें' : 'Send Us a Message'}</span>
                </div>

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
            {/* Direct Email Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-md">
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
                href="mailto:support@aradhnamarg.com"
                className="inline-flex items-center gap-2 text-saffron hover:text-orange-600 font-bold text-sm bg-amber-50/70 hover:bg-amber-100/70 px-4 py-2.5 rounded-xl border border-amber-200/80 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>support@aradhnamarg.com</span>
              </a>
            </div>

            {/* Official Social Media Channels */}
            <div className="bg-gradient-to-br from-[#1c0f08] via-[#24130a] to-[#1c0f08] text-white rounded-3xl p-6 sm:p-8 border border-amber-900/40 shadow-xl">
              <div className="flex items-center gap-2 text-saffron text-xs font-bold uppercase tracking-widest mb-2 font-hindi-heading">
                <Globe className="w-4 h-4" />
                <span>{isHi ? 'आधिकारिक डिजिटल चैनल' : 'Official Channels'}</span>
              </div>
              <h3 className="text-lg font-black text-white font-hindi-heading mb-4">
                {isHi ? 'सोशल मीडिया पर जुड़ें' : 'Connect With Us'}
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <a
                  href="https://youtube.com/@thebhaktimarg_official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                >
                  <span className="font-bold text-slate-200 group-hover:text-red-400">YouTube</span>
                  <span className="text-slate-400 text-xs">@thebhaktimarg_official</span>
                </a>

                <a
                  href="https://instagram.com/thebhaktimarg_official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                >
                  <span className="font-bold text-slate-200 group-hover:text-pink-400">Instagram</span>
                  <span className="text-slate-400 text-xs">@thebhaktimarg_official</span>
                </a>

                <a
                  href="https://facebook.com/sachinkumarverma2001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                >
                  <span className="font-bold text-slate-200 group-hover:text-blue-400">Facebook</span>
                  <span className="text-slate-400 text-xs">sachinkumarverma2001</span>
                </a>
              </div>
            </div>

            {/* Support & Donation Card */}
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
          </div>
        </div>
      </div>
    </div>
  );
};
