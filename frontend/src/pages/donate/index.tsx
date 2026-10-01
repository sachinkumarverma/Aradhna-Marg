import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShieldCheck,
  Sparkles,
  Server,
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Loader2,
  Users,
  Feather
} from 'lucide-react';
import { PaymentApi } from '@/api/paymentApi';
import { useTranslation } from '@/i18n/LanguageContext';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PRESET_AMOUNTS = [21, 51, 101, 251, 501, 1100];

export const DonatePage: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';

  const [selectedAmount, setSelectedAmount] = useState<number>(101);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [donorPhone, setDonorPhone] = useState<string>('');
  const [donorNote, setDonorNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>(
    import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_T8YGTOWbbSya4S'
  );
  const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false);
  const [successPaymentDetails, setSuccessPaymentDetails] = useState<any>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Fetch Gateway Config on mount
  useEffect(() => {
    PaymentApi.getConfig()
      .then((cfg) => {
        if (cfg?.keyId) {
          setRazorpayKeyId(cfg.keyId);
        }
      })
      .catch((err) => {
        console.error('Failed to load payment config:', err);
      });
  }, []);

  // Dynamically load Razorpay Checkout Script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    if (val && Number(val) > 0) {
      setSelectedAmount(Number(val));
    }
  };

  const currentAmount = customAmount && Number(customAmount) > 0 ? Number(customAmount) : selectedAmount;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentAmount || currentAmount < 1) {
      toast.error(isHi ? 'कृपया कम से कम ₹1 की राशि चुनें।' : 'Please choose an amount of at least ₹1.');
      return;
    }

    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error(
          isHi
            ? 'पेमेंट गेटवे लोड नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें।'
            : 'Failed to load payment gateway. Please check your internet.'
        );
        setLoading(false);
        return;
      }

      // 1. Create order on backend
      const order = await PaymentApi.createOrder({
        amount: currentAmount,
        donorName: donorName.trim() || undefined,
        donorEmail: donorEmail.trim() || undefined,
        donorPhone: donorPhone.trim() || undefined,
        note: donorNote.trim() || undefined
      });

      if (!order || !order.orderId) {
        throw new Error('Order creation failed');
      }

      const activeKey = order.keyId || razorpayKeyId;

      // 2. Configure Razorpay checkout options
      const options = {
        key: activeKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Aradhna Marg | आराधना मार्ग',
        description: isHi ? 'सनातन धर्म प्रचार एवं सेवा सहयोग' : 'Sanatan Dharma Devotional Seva Contribution',
        image: '/favicon.ico',
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            const verificationRes = await PaymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              donorName: donorName.trim() || 'श्रद्धालु',
              amount: currentAmount
            });

            setSuccessPaymentDetails({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: currentAmount,
              donorName: donorName.trim() || (isHi ? 'श्रद्धालु' : 'Devotee')
            });
            setSuccessModalOpen(true);
            toast.success(
              isHi
                ? 'सहयोग हेतु हार्दिक धन्यवाद! जय श्री राम।'
                : 'Thank you for your generous contribution! Jai Shri Ram.'
            );
          } catch (err: any) {
            console.error('Payment verification failed:', err);
            toast.error(isHi ? 'भुगतान सत्यापन में समस्या आई।' : 'Payment verification failed.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: donorName.trim() || undefined,
          email: donorEmail.trim() || undefined,
          contact: donorPhone.trim() || undefined
        },
        notes: {
          purpose: 'Aradhna Marg Seva'
        },
        theme: {
          color: '#FF4B00'
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setLoading(false);
        toast.error(
          response.error?.description ||
            (isHi ? 'भुगतान असफल रहा। कृपया पुनः प्रयास करें।' : 'Payment failed. Please try again.')
        );
      });

      rzp.open();
    } catch (error: any) {
      console.error('Donation error:', error);
      toast.error(
        error?.response?.data?.message ||
          (isHi ? 'भुगतान प्रक्रिया आरंभ नहीं हो सकी।' : 'Failed to initiate payment process.')
      );
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: isHi ? 'मेरी सहयोग राशि का उपयोग कैसे किया जाता है?' : 'How is my contribution utilized?',
      a: isHi
        ? 'आपकी दी गई श्रद्धा राशि का 100% उपयोग क्लाउड सर्वर की लागत, मीडिया स्ट्रीमिंग बैंडविड्थ, डेटाबेस रखरखाव, 18 पुराणों व भजनों के डिजिटलीकरण तथा मंच को निर्बाध व विज्ञापन-मुक्त बनाए रखने में किया जाता है।'
        : '100% of your contribution directly funds our high-speed cloud infrastructure, audio streaming CDN, digitization of 18 Mahapuranas & Bhajans, and keeping the platform clean and ad-light.'
    },
    {
      q: isHi ? 'क्या भुगतान प्रक्रिया सुरक्षित है?' : 'Is the payment transaction secure?',
      a: isHi
        ? 'हाँ, आपका भुगतान भारत के अग्रणी और आरबीआई-अधिकृत पेमेंट गेटवे (Razorpay) के माध्यम से 256-बिट SSL एन्क्रिप्शन के साथ पूर्णतः सुरक्षित संसाधित होता है।'
        : 'Yes, your payment is processed via Razorpay with 256-bit bank-grade SSL encryption supporting all major UPI apps, cards, and net banking.'
    },
    {
      q: isHi ? 'भुगतान के कौन-कौन से माध्यम उपलब्ध हैं?' : 'What payment methods are supported?',
      a: isHi
        ? 'आप Google Pay, PhonePe, Paytm, BHIM UPI, सभी बैंकों के डेबिट/क्रेडिट कार्ड तथा नेट बैंकिंग के माध्यम से सुविधापूर्वक सहयोग कर सकते हैं।'
        : 'You can contribute using any UPI app (Google Pay, PhonePe, Paytm, BHIM), Debit/Credit cards, or Net Banking.'
    },
    {
      q: isHi ? 'क्या कोई न्यूनतम या अधिकतम राशि की सीमा है?' : 'Is there a minimum or maximum limit?',
      a: isHi
        ? 'भक्ति में श्रद्धा का महत्व है, राशि का नहीं। आप ₹1 से लेकर अपनी सामर्थ्यानुसार कोई भी ऐच्छिक राशि अर्पित कर सकते हैं।'
        : 'Devotion is about intention, not amount. You can offer any amount starting from as little as ₹1 according to your wish.'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-24 pb-20 font-hindi-body selection:bg-saffron selection:text-white">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-darkBrown text-xs sm:text-sm font-bold uppercase tracking-widest mb-6 font-hindi-heading shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-saffron fill-saffron" />
            <span>{isHi ? '🪔 आराधना मार्ग सेवा एवं सहयोग' : '🪔 Aradhna Marg Seva & Support'}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-darkBrown tracking-tight leading-tight mb-5 font-hindi-heading"
          >
            {isHi ? (
              <>
                यह मंच पूरी तरह मुफ़्त है — <br className="hidden sm:inline" />
                <span className="text-saffron">पर इसे संचालित रखना मुफ़्त नहीं है।</span>
              </>
            ) : (
              <>
                This platform is 100% Free — <br className="hidden sm:inline" />
                <span className="text-saffron">Yet sustaining it requires your support.</span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed mb-8"
          >
            {isHi
              ? 'हाई-स्पीड मीडिया सर्वर, 18 महापुराणों व भजनों का डिजिटलीकरण, डेटाबेस और निरंतर तकनीकी सेवा। सनातन धर्म की इस डिजिटल सेवा को अविरल बनाए रखने में आपकी दक्षिणा अत्यंत बहुमूल्य है।'
              : 'High-speed cloud servers, authentic digitization of 18 Mahapuranas & Bhajans, audio streaming, and continuous software maintenance. Your kind support helps keep Sanatan Dharma accessible to millions worldwide.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#checkout-section"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-saffron hover:bg-orange-600 active:scale-95 text-white font-bold text-base sm:text-lg rounded-2xl shadow-lg shadow-saffron/25 transition-all font-hindi-heading cursor-pointer"
            >
              <Heart className="w-5 h-5 fill-white" />
              <span>{isHi ? 'सहयोग राशि भेंट करें' : 'Offer Your Contribution'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
            <a
              href="#story-section"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 bg-white hover:bg-amber-50/60 border border-orange-200 text-darkBrown font-bold text-sm sm:text-base rounded-2xl transition-all font-hindi-heading shadow-xs"
            >
              <span>{isHi ? 'उद्देश्य एवं प्रभाव पढ़ें ↓' : 'Read Our Mission ↓'}</span>
            </a>
          </motion.div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isHi
                ? '100% सुरक्षित एवं ऐच्छिक सहयोग (Powered by Razorpay)'
                : '100% Secure & Optional Support (Powered by Razorpay)'}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Interactive Donation Checkout Card */}
      <section id="checkout-section" className="px-4 py-8 sm:py-12 relative z-10 scroll-mt-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[540px] mx-auto bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden relative"
        >
          <div className="h-2.5 w-full bg-gradient-to-r from-amber-400 via-saffron to-orange-500" />

          <div className="p-6 sm:p-9 text-center">
            {/* Sacred Emblem */}
            <div className="w-16 h-16 mx-auto mb-5 text-saffron font-black text-4xl flex items-center justify-center bg-amber-50 rounded-2xl border border-amber-200 shadow-inner font-hindi-heading">
              ॐ
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-saffron mb-1.5 font-hindi-heading">
              {isHi ? 'आराधना मार्ग सेवा कोष' : 'Aradhna Marg Seva Fund'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-darkBrown mb-2 leading-tight font-hindi-heading">
              {isHi ? 'धर्म कार्य में अमूल्य सहयोग दें' : 'Contribute to Sacred Seva'}
            </h2>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mb-7">
              {isHi
                ? 'इस मंच को निर्बाध, विज्ञापन-मुक्त और सर्वसुलभ रखने के लिए आपकी दक्षिणा महत्वपूर्ण है।'
                : 'Your dakshina keeps this spiritual platform fast, ad-light, and accessible to everyone.'}
            </p>

            <form onSubmit={handlePayment} className="text-left">
              {/* Preset Amounts Grid */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-hindi-heading text-center">
                  {isHi ? 'सहयोग राशि चुनें (INR ₹)' : 'Select Amount (INR ₹)'}
                </label>

                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {PRESET_AMOUNTS.map((amt) => {
                    const isSelected = selectedAmount === amt && !customAmount;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleAmountSelect(amt)}
                        className={`py-3 rounded-xl border font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'border-saffron bg-saffron text-white shadow-md scale-[1.02]'
                            : 'border-gray-200 bg-white text-darkBrown hover:border-saffron hover:bg-amber-50/50'
                        }`}
                      >
                        <span>₹{amt}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Input */}
                <div className="relative max-w-xs mx-auto">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                  <input
                    type="number"
                    min="1"
                    placeholder={isHi ? 'अन्य राशि दर्ज करें' : 'Enter other amount'}
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    className="w-full py-3 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-base text-darkBrown outline-none focus:border-saffron focus:bg-white focus:ring-2 focus:ring-saffron/20 transition-all text-center placeholder:font-normal placeholder:text-sm"
                  />
                </div>
              </div>

              {/* Optional Donor Information */}
              <div className="space-y-3 mb-6 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 font-hindi-heading">
                    {isHi ? 'आपका नाम (ऐच्छिक)' : 'Your Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isHi ? 'जैसे: राहुल शर्मा' : 'e.g. Rahul Sharma'}
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-darkBrown outline-none focus:border-saffron focus:bg-white focus:ring-2 focus:ring-saffron/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-hindi-heading">
                      {isHi ? 'ईमेल (रसीद हेतु - ऐच्छिक)' : 'Email (For receipt - Optional)'}
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-darkBrown outline-none focus:border-saffron focus:bg-white focus:ring-2 focus:ring-saffron/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-hindi-heading">
                      {isHi ? 'फ़ोन नंबर (ऐच्छिक)' : 'Phone (Optional)'}
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-darkBrown outline-none focus:border-saffron focus:bg-white focus:ring-2 focus:ring-saffron/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 font-hindi-heading">
                    {isHi ? 'संदेश / प्रार्थना (ऐच्छिक)' : 'Message / Prayer (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isHi ? 'जय श्री राम / हर हर महादेव...' : 'Jai Shri Ram...'}
                    value={donorNote}
                    onChange={(e) => setDonorNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-darkBrown outline-none focus:border-saffron focus:bg-white focus:ring-2 focus:ring-saffron/20 transition-all"
                  />
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading || !currentAmount || currentAmount < 1}
                className="w-full py-4 bg-gradient-to-r from-saffron to-orange-600 hover:from-orange-600 hover:to-saffron text-white font-extrabold text-lg sm:text-xl rounded-2xl shadow-lg shadow-saffron/30 transition-all active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer font-hindi-heading"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isHi ? 'प्रतीक्षा करें...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <span>ॐ {isHi ? 'श्रद्धा भेंट करें' : 'Offer Seva'}</span>
                    <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-base">₹{currentAmount}</span>
                  </>
                )}
              </button>

              <div className="mt-4 text-center flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {isHi
                    ? 'UPI, Card, NetBanking द्वारा सुरक्षित भुगतान (Razorpay)'
                    : 'Secured via UPI, Cards, NetBanking (Razorpay)'}
                </span>
              </div>
            </form>
          </div>
        </motion.div>
      </section>

      {/* 3. Why Your Support Matters Section */}
      <section id="story-section" className="max-w-6xl mx-auto px-4 py-12 sm:py-16 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-saffron uppercase tracking-widest font-hindi-heading mb-2 block">
            {isHi ? 'हमारा संकल्प एवं प्रभाव' : 'Our Mission & Impact'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-darkBrown font-hindi-heading leading-tight mb-3">
            {isHi ? 'आपके सहयोग से हम क्या संभव बनाते हैं?' : 'What Your Generosity Makes Possible'}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            {isHi
              ? 'आराधना मार्ग पर हर दिन हज़ारों श्रद्धालु भक्ति व ज्ञान प्राप्त करते हैं। आपके सहयोग से यह सेवा निर्बाध चलती है।'
              : 'Every day thousands of devotees connect with sacred hymns and scriptures on Aradhna Marg.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-orange-100/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-saffron mb-4">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-darkBrown font-hindi-heading mb-2">
              {isHi ? 'उच्च गति क्लाउड CDN' : 'Fast Cloud CDN'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isHi
                ? 'लाखों श्रद्धालुओं के लिए त्वरित गति से ऑडियो भजन और शास्त्र लोड करने हेतु उन्नत सर्वर अवसंरचना।'
                : 'Enterprise servers ensuring lightning-fast streaming and PDF downloads for devotees.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-orange-100/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-saffron mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-darkBrown font-hindi-heading mb-2">
              {isHi ? '18 महापुराण डिजिटलीकरण' : 'Scripture Preservation'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isHi
                ? 'दुर्लभ धर्मग्रंथों, स्तोत्रों, आरतियों एवं भावार्थों का प्रामाणिक संकलन और हिंदी-अंग्रेजी अनुवाद।'
                : 'Preserving sacred scriptures, hymns, and mantras with authentic translations.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-orange-100/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-saffron mb-4">
              <Feather className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-darkBrown font-hindi-heading mb-2">
              {isHi ? 'स्वच्छ व विज्ञापन-मुक्त' : 'Ad-Light Experience'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isHi
                ? 'भक्ति में कोई बाधा न आए, इसलिए मंच को अनावश्यक विज्ञापनों से मुक्त और शांत रखा जाता है।'
                : 'Keeping devotion clean and serene without intrusive or irritating ad popups.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-orange-100/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-saffron mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-darkBrown font-hindi-heading mb-2">
              {isHi ? 'निशुल्क आध्यात्मिक सेवा' : '100% Community Free'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isHi
                ? 'सनातन धर्म की अमूल्य धरोहर हर व्यक्ति तक बिना किसी शुल्क या रुकावट के पहुँचाना हमारा संकल्प है।'
                : 'Guaranteed open access to Sanatan heritage for generations to come.'}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Frequently Asked Questions (FAQ) Section */}
      <section className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <HelpCircle className="w-8 h-8 text-saffron mx-auto mb-2" />
          <h2 className="text-2xl sm:text-3xl font-bold text-darkBrown font-hindi-heading">
            {isHi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left font-bold text-darkBrown flex items-center justify-between gap-4 font-hindi-heading text-sm sm:text-base cursor-pointer hover:text-saffron transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-saffron' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Success Modal */}
      <AnimatePresence>
        {successModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-orange-100 relative"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-black text-darkBrown font-hindi-heading mb-2">
                {isHi ? 'सहयोग सफल रहा! जय श्री राम' : 'Contribution Successful!'}
              </h3>

              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                {isHi
                  ? `आदरणीय ${successPaymentDetails?.donorName || 'श्रद्धालु'}, आपके द्वारा अर्पित ₹${successPaymentDetails?.amount} की पावन दक्षिणा स्वीकार हो गई है। धर्म सेवा में आपके सहयोग के लिए कोटि-कोटि धन्यवाद!`
                  : `Dear ${successPaymentDetails?.donorName || 'Devotee'}, your contribution of ₹${successPaymentDetails?.amount} has been received. Thank you for supporting the propagation of Sanatan Dharma!`}
              </p>

              {successPaymentDetails?.paymentId && (
                <div className="bg-amber-50/70 rounded-xl p-3 text-xs text-slate-600 mb-6 font-mono border border-amber-100">
                  <span>Payment ID: {successPaymentDetails.paymentId}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSuccessModalOpen(false)}
                className="w-full py-3 bg-saffron hover:bg-orange-600 text-white font-bold rounded-xl transition-colors font-hindi-heading cursor-pointer"
              >
                {isHi ? 'मुख्य पृष्ठ पर जाएँ' : 'Done'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
