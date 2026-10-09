import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShieldCheck,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Loader2,
  Scroll,
  Music4,
  CalendarCheck2,
  Bot,
  Zap,
  Flame,
  Award
} from 'lucide-react';
import { PaymentApi } from '@/api/paymentApi';
import { useTranslation } from '@/i18n/LanguageContext';
import toast from 'react-hot-toast';
import { SEOHead, buildBreadcrumbSchema } from '@components/seo';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PRESET_AMOUNTS = [11, 21, 51, 101, 251, 501];

export const DonatePage: React.FC = () => {
  const { language } = useTranslation();
  const isHi = language === 'hi';

  const [selectedAmount, setSelectedAmount] = useState<number>(51);
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
            await PaymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              donorName: donorName.trim() || 'श्रद्धालु',
              donorEmail: donorEmail.trim() || undefined,
              donorPhone: donorPhone.trim() || undefined,
              amount: currentAmount,
              note: donorNote.trim() || undefined
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
          purpose: 'Aradhna Marg Devotional Seva'
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

  const useCases = [
    {
      icon: Scroll,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      titleHi: '18 महापुराण एवं दुर्लभ ग्रंथ डिजिटलीकरण',
      titleEn: '18 Mahapuranas & Vedic Library',
      descHi:
        'संस्कृत श्लोकों का शुद्ध उच्चारण, सरल हिंदी-अंग्रेजी भावार्थ, और शोधकर्ताओं व श्रद्धालुओं हेतु प्रामाणिक डिजिटल ग्रंथालय।',
      descEn:
        'Preserving rare scriptures, authentic Sanskrit shlokas with word-by-word meaning, and open-access devotional literature.'
    },
    {
      icon: Music4,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      titleHi: 'उच्च गुणवत्ता भजन व मंत्र ऑडियो स्ट्रीमिंग',
      titleEn: 'High-Fidelity Devotional Audio Stream',
      descHi:
        'हाई-स्पीड क्लाउड सीडीएन अवसंरचना, जिससे लाखों भक्त बिना किसी विज्ञापन या रुकावट के शांतिपूर्वक आरती व स्तोत्र सुन सकें।',
      descEn:
        'Ultra-fast cloud CDN infrastructure delivering serene, crystal-clear Aartis, Chalisas, and Stotrams without disruptive ads.'
    },
    {
      icon: CalendarCheck2,
      color: 'from-amber-600 to-yellow-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      titleHi: 'दैनिक वैदिक पंचांग एवं शुभ मुहूर्त',
      titleEn: 'Daily Vedic Panchang & Festival Insights',
      descHi: 'सटीक खगोलीय गणना, व्रत-त्योहारों के नियम, पूजा विधि, और सनातन कैलेंडर का सरल व विस्तृत मार्गदर्शन।',
      descEn:
        'Precise astrological calculations, tithi alerts, festive rituals, and spiritual significance for global devotees.'
    },
    {
      icon: Bot,
      color: 'from-red-500 to-amber-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      titleHi: 'वैदिक AI सहायक एवं ज्ञान मार्गदर्शन',
      titleEn: 'Vedic AI Dharma Guide',
      descHi: 'नई पीढ़ी को धर्मग्रंथों व संशय निवारण से जोड़ने हेतु आधुनिक AI तकनीक से शास्त्रों का सुलभ संवाद।',
      descEn:
        'Empowering the younger generation with instant, scripture-grounded answers to spiritual and philosophical queries.'
    }
  ];

  const faqs = [
    {
      q: isHi ? 'मेरी सहयोग राशि का उपयोग किस प्रकार होता है?' : 'How is my contribution utilized?',
      a: isHi
        ? 'आपकी दी गई श्रद्धा राशि का 100% उपयोग क्लाउड सर्वर इंफ्रास्ट्रक्चर, हाई-स्पीड मीडिया सीडीएन, डेटाबेस रखरखाव, 18 पुराणों व भजनों के डिजिटलीकरण तथा मंच को सभी के लिए विज्ञापन-मुक्त व सर्वसुलभ बनाए रखने में होता है।'
        : '100% of your contribution directly powers our high-speed cloud infrastructure, audio streaming CDN, digitization of 18 Mahapuranas & Bhajans, and keeping the platform completely ad-light and open to all.'
    },
    {
      q: isHi ? 'क्या मेरा भुगतान सुरक्षित है?' : 'Is the payment transaction secure?',
      a: isHi
        ? 'हाँ, आपका भुगतान भारत के अग्रणी और आरबीआई-अधिकृत पेमेंट गेटवे (Razorpay) के माध्यम से 256-बिट SSL बैंक-ग्रेड एन्क्रिप्शन के साथ पूर्णतः सुरक्षित होता है।'
        : 'Yes, your payment is processed directly via Razorpay with 256-bit bank-grade SSL encryption supporting all major UPI apps, cards, and net banking.'
    },
    {
      q: isHi ? 'भुगतान के कौन-कौन से माध्यम उपलब्ध हैं?' : 'What payment options are available?',
      a: isHi
        ? 'आप Google Pay, PhonePe, Paytm, BHIM UPI, सभी बैंकों के डेबिट/क्रेडिट कार्ड तथा नेट बैंकिंग के माध्यम से सुविधापूर्वक सहयोग कर सकते हैं।'
        : 'You can contribute using any UPI app (Google Pay, PhonePe, Paytm, BHIM), Debit/Credit cards, or Net Banking.'
    },
    {
      q: isHi ? 'क्या कोई न्यूनतम या अधिकतम राशि की सीमा है?' : 'Is there a minimum or maximum limit?',
      a: isHi
        ? 'भक्ति में श्रद्धा का महत्व है, राशि का नहीं। आप ₹1 से लेकर अपनी सामर्थ्यानुसार कोई भी ऐच्छिक राशि अर्पित कर सकते हैं।'
        : 'Devotion is about heart and intention, not amount. You can offer any amount starting from as little as ₹1 according to your wish.'
    }
  ];

  const pageTitle = isHi ? 'सहयोग एवं सेवा संकल्प (Support Us)' : 'Support Our Mission & Devotional Seva';
  const pageDesc = isHi
    ? 'सनातन धर्म, वेद, पुराणों के डिजिटलीकरण एवं भक्ति प्रचार हेतु आराधना मार्ग मंच का सहयोग करें।'
    : 'Support Aradhna Marg mission to digitize sacred Hindu scriptures, puranas, and preserve devotional heritage.';

  const breadcrumbs = buildBreadcrumbSchema([
    { name: isHi ? 'मुख्य पृष्ठ' : 'Home', item: '/' },
    { name: isHi ? 'सहयोग' : 'Support Us', item: '/support-us' }
  ]);

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] pt-6 pb-20 selection:bg-saffron selection:text-white">
      <SEOHead title={pageTitle} description={pageDesc} canonicalPath="/support-us" schema={breadcrumbs} />
      {/* 1. Hero & Vedic Mission Banner */}
      <section className="relative overflow-hidden pt-6 pb-10 sm:pt-12 sm:pb-14 px-4">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-amber-200/35 via-orange-100/20 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Top Devotional Label */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-saffron text-xs sm:text-sm md:text-base font-bold tracking-wide mb-3 sm:mb-4 font-hindi-heading"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-saffron shrink-0" />
            <span>{isHi ? 'सनातन धर्म सेवा एवं सहयोग संकल्प' : 'Sanatan Seva & Platform Support'}</span>
            <span className="font-extrabold text-base sm:text-lg">ॐ</span>
          </motion.div>

          {/* Main Hero Headline - Clear line spacing, matching Deities page styling */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-hindi-heading tracking-tight mb-3 sm:mb-5 flex flex-col items-center gap-1 sm:gap-2 leading-tight"
          >
            {isHi ? (
              <>
                <span className="block text-darkBrown font-hindi-heading">सनातन ज्ञान और भक्ति की अविरल धारा</span>
                <span className="block text-saffron font-hindi-heading">को सशक्त व सर्वसुलभ बनाएं</span>
              </>
            ) : (
              <>
                <span className="block text-darkBrown font-hindi-heading">Empowering Devotion & Vedic Wisdom</span>
                <span className="block text-saffron font-hindi-heading">For Devotees Worldwide</span>
              </>
            )}
          </motion.h1>

          {/* Subtitle / Context */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 text-xs sm:text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed mb-6 sm:mb-8"
          >
            {isHi
              ? 'आराधना मार्ग पर प्रतिदिन श्रद्धालु 18 महापुराणों, स्तोत्रों, भजनों व पंचांग का निशुल्क अध्ययन व श्रवण करते हैं। इस डिजिटल ज्ञान-मंदिर को अविरल, तीव्र और विज्ञापन-मुक्त रखने में आपकी दक्षिणा पावन योगदान है।'
              : 'Aradhna Marg empowers devotees worldwide with authentic scriptures, bhajans, stotras, and daily spiritual wisdom. Your voluntary support preserves this knowledge sanctuary completely free and fast for everyone.'}
          </motion.p>

          {/* Sacred Sanskrit Shloka Quote Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="max-w-xl mx-auto mb-6 sm:mb-8 p-3 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 backdrop-blur-xs text-center shadow-xs"
          >
            <p className="text-saffron font-bold text-xs sm:text-sm md:text-base font-hindi-heading tracking-wide leading-snug">
              {isHi
                ? '॥ स्वल्पमप्यस्य धर्मस्य त्रायते महतो भयात् ॥'
                : '“Svalpam apy asya dharmasya trāyate mahato bhayāt”'}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
              {isHi
                ? '— श्रीमद्भगवद्गीता (धर्म के मार्ग पर किया गया थोड़ा सा भी प्रयास महान फल देता है)'
                : '— Bhagavad Gita (Even a small step in dharma protects from great fear)'}
            </p>
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <a
              href="#checkout-section"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-saffron to-orange-600 hover:from-orange-600 hover:to-saffron active:scale-95 text-white font-bold text-sm sm:text-base md:text-lg rounded-2xl shadow-lg shadow-saffron/25 transition-all font-hindi-heading cursor-pointer"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              <span>{isHi ? 'श्रद्धा दक्षिणा भेंट करें' : 'Offer Seva Contribution'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
            <a
              href="#impact-section"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-4 bg-white hover:bg-amber-50/70 border border-orange-200 text-darkBrown font-bold text-xs sm:text-sm md:text-base rounded-2xl transition-all font-hindi-heading shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-saffron" />
              <span>{isHi ? 'हमारी सेवा एवं उपयोगिता देखें ↓' : 'Explore Platform Impact ↓'}</span>
            </a>
          </motion.div>

          {/* Security & Authenticity Trust Badge */}
          <div className="mt-6 sm:mt-7 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isHi
                ? '100% सुरक्षित भुगतान • Razorpay द्वारा संचालित • कोई छुपा शुल्क नहीं'
                : '100% Secure Transaction • Powered by Razorpay • Zero hidden charges'}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Interactive Seva Contribution Section */}
      <section id="checkout-section" className="px-4 py-6 sm:py-12 relative z-10 scroll-mt-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[500px] mx-auto bg-white rounded-3xl shadow-xl border border-orange-100/90 overflow-hidden relative"
        >
          {/* Top Decorative Gradient Accent Bar */}
          <div className="h-2.5 w-full bg-gradient-to-r from-amber-400 via-saffron to-orange-600" />

          <div className="p-5 sm:p-8 text-center">
            {/* Sacred Vedic Emblem */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2.5 sm:mb-3.5 text-saffron font-extrabold text-2xl sm:text-3xl flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-inner font-hindi-heading">
              ॐ
            </div>

            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-saffron mb-1 font-hindi-heading">
              {isHi ? 'आराधना मार्ग सेवा कोष' : 'Aradhna Marg Seva Fund'}
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-darkBrown mb-1.5 leading-snug font-hindi-heading">
              {isHi ? 'पावन सेवा में सहयोग दें' : 'Make Your Sacred Offering'}
            </h2>
            <p className="text-slate-500 font-normal text-xs sm:text-sm mb-5 sm:mb-6 leading-relaxed">
              {isHi
                ? 'अपनी सामर्थ्य और श्रद्धा अनुसार कोई भी राशि चुनें।'
                : 'Choose an amount according to your wish and devotion.'}
            </p>

            <form onSubmit={handlePayment} className="text-left">
              {/* Preset Amounts Grid - Clean, simple amounts only from 11 to 501 */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-hindi-heading">
                    {isHi ? 'सहयोग राशि चुनें (₹ INR)' : 'Select Amount (₹ INR)'}
                  </label>
                  {currentAmount > 0 && (
                    <span className="text-xs font-bold text-saffron font-hindi-heading">
                      {isHi ? `चयनित: ₹${currentAmount}` : `Selected: ₹${currentAmount}`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  {PRESET_AMOUNTS.map((amt) => {
                    const isSelected = selectedAmount === amt && !customAmount;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleAmountSelect(amt)}
                        className={`py-2.5 sm:py-3 px-2 rounded-xl border font-bold text-sm sm:text-lg transition-all flex items-center justify-center gap-1 cursor-pointer font-hindi-heading ${
                          isSelected
                            ? 'border-saffron bg-gradient-to-r from-saffron to-orange-600 text-white shadow-md shadow-saffron/25 scale-[1.02]'
                            : 'border-gray-200 bg-white text-darkBrown hover:border-saffron/60 hover:bg-amber-50/40'
                        }`}
                      >
                        <span>₹{amt}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Input Box */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-base">₹</span>
                  <input
                    type="number"
                    min="1"
                    placeholder={isHi ? 'अन्य कोई भी राशि (₹)' : 'Other amount (₹)'}
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    className="w-full py-2.5 pl-8 pr-4 bg-gray-50/80 border border-gray-200 rounded-xl font-bold text-base text-darkBrown outline-none focus:border-saffron focus:bg-white focus:ring-2 focus:ring-saffron/20 transition-all text-center placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Optional Donor Information */}
              <div className="space-y-3 mb-6 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 font-hindi-heading">
                    {isHi ? 'आपका शुभ नाम (ऐच्छिक)' : 'Your Name (Optional)'}
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
                    {isHi ? 'संकल्प / प्रार्थना संदेश (ऐच्छिक)' : 'Sankalp / Prayer Note (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isHi ? 'जय श्री राम / हर हर महादेव / कुल कल्याण...' : 'Jai Shri Ram...'}
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
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-saffron via-orange-600 to-amber-600 hover:from-orange-600 hover:to-saffron text-white font-bold text-base sm:text-lg rounded-2xl shadow-lg shadow-saffron/30 transition-all active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer font-hindi-heading"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isHi ? 'प्रतीक्षा करें...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <span>ॐ {isHi ? 'श्रद्धा दक्षिणा अर्पित करें' : 'Offer Seva Contribution'}</span>
                    <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-base font-bold">₹{currentAmount}</span>
                  </>
                )}
              </button>

              <div className="mt-4 text-center flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {isHi
                    ? 'UPI (GPay/PhonePe/Paytm), Card, NetBanking सुरक्षित भुगतान'
                    : 'Secured via UPI (GPay/PhonePe/Paytm), Cards & NetBanking'}
                </span>
              </div>
            </form>
          </div>
        </motion.div>
      </section>

      {/* 3. Unique Aradhna Marg Impact Pillars */}
      <section id="impact-section" className="max-w-6xl mx-auto px-4 py-10 sm:py-16 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="flex items-center justify-center gap-2 text-saffron text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 font-hindi-heading">
            <Flame className="w-4 h-4 fill-saffron text-saffron" />
            <span>{isHi ? 'आपकी दक्षिणा का पावन सदुपयोग' : 'Where Your Contribution Reaches'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-darkBrown font-hindi-heading leading-tight mb-2.5 sm:mb-3">
            {isHi ? 'सनातन धर्म के 4 डिजिटल स्तंभ' : 'The 4 Digital Pillars We Build Together'}
          </h2>
          <p className="text-slate-600 text-xs sm:text-base leading-relaxed">
            {isHi
              ? 'आराधना मार्ग पर हर दिन हज़ारों श्रद्धालु भक्ति व ज्ञान प्राप्त करते हैं। आपके सहयोग से यह सेवा निर्बाध चलती है।'
              : 'Every single rupee directly enriches scriptures, audio feeds, and authentic spiritual tools for everyone.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((uc, i) => {
            const Icon = uc.icon;
            return (
              <div
                key={i}
                className="bg-white p-5 sm:p-7 rounded-3xl border border-orange-100/90 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start gap-4"
              >
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${uc.bgColor} ${uc.borderColor} border flex items-center justify-center text-saffron shrink-0 shadow-xs`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-saffron" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-darkBrown font-hindi-heading mb-1.5 sm:mb-2 leading-snug">
                    {isHi ? uc.titleHi : uc.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed sm:leading-loose">
                    {isHi ? uc.descHi : uc.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Commitment Badge Cards */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 sm:p-5 rounded-2xl border border-amber-200/80 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-100 flex items-center justify-center text-saffron">
              <Zap className="w-5 h-5 text-saffron" />
            </div>
            <h4 className="font-bold text-darkBrown text-sm sm:text-base font-hindi-heading mb-1">
              {isHi ? '100% प्रत्यक्ष तकनीकी उपयोग' : '100% Tech Infrastructure'}
            </h4>
            <p className="text-xs text-slate-500">
              {isHi ? 'सीधे सर्वर, डेटाबेस व अनुवाद में निवेश' : 'Zero commission, pure digital seva'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 sm:p-5 rounded-2xl border border-amber-200/80 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-100 flex items-center justify-center text-saffron">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h4 className="font-bold text-darkBrown text-sm sm:text-base font-hindi-heading mb-1">
              {isHi ? 'सुरक्षित एवं प्रामाणिक' : 'Bank-Grade Security'}
            </h4>
            <p className="text-xs text-slate-500">
              {isHi ? 'Razorpay SSL 256-बिट सुरक्षा' : 'Encrypted official payment gateway'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 sm:p-5 rounded-2xl border border-amber-200/80 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-100 flex items-center justify-center text-saffron">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <h4 className="font-bold text-darkBrown text-sm sm:text-base font-hindi-heading mb-1">
              {isHi ? 'विज्ञापन-मुक्त अनुभव' : 'Serene & Ad-Light'}
            </h4>
            <p className="text-xs text-slate-500">
              {isHi ? 'भक्ति साधना में कोई व्यवधान नहीं' : 'Preserving peaceful devotional environment'}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Frequently Asked Questions Section */}
      <section className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-6 sm:mb-8">
          <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-saffron mx-auto mb-2" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-darkBrown font-hindi-heading leading-tight">
            {isHi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className={`w-full px-4 sm:px-5 text-left font-bold text-darkBrown flex items-center justify-between gap-4 font-hindi-heading text-xs sm:text-sm md:text-base cursor-pointer hover:text-saffron transition-colors ${
                    isOpen ? 'pt-3.5 sm:pt-4 pb-2.5 sm:pb-3' : 'py-3.5 sm:py-4'
                  }`}
                >
                  <span className="leading-snug">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-saffron' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pt-3 pb-3.5 sm:pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed sm:leading-loose border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Success Celebration Modal */}
      <AnimatePresence>
        {successModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-orange-100 relative"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-darkBrown font-hindi-heading mb-2">
                {isHi ? 'सहयोग सफल रहा! जय श्री राम' : 'Contribution Successful!'}
              </h3>

              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                {isHi
                  ? `आदरणीय ${successPaymentDetails?.donorName || 'श्रद्धालु'}, आपके द्वारा अर्पित ₹${successPaymentDetails?.amount} की पावन दक्षिणा स्वीकार हो गई है। सनातन धर्म सेवा में आपके इस पावन सहयोग के लिए कोटि-कोटि धन्यवाद!`
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
                className="w-full py-3.5 bg-gradient-to-r from-saffron to-orange-600 hover:from-orange-600 hover:to-saffron text-white font-bold rounded-xl transition-colors font-hindi-heading cursor-pointer shadow-md shadow-saffron/20"
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
