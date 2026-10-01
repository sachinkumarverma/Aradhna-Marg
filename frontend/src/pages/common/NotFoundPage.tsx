import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Music,
  Scroll,
  BookOpen,
  ArrowRight,
  Home as HomeIcon,
  Compass,
  Flame,
  Heart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@i18n/LanguageContext';
import { PublicApi } from '@api/publicApi';

export const NotFoundPage: React.FC = () => {
  const { language, t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const navigate = useNavigate();

  const isHindi = language === 'hi';

  const quickPills = isHindi
    ? ['राधारमणं हरे हरे', 'शिव पुराण', 'हनुमान चालीसा', 'श्रीमद्भगवद्गीता', 'महाशिवरात्रि']
    : ['Radha Ramanam', 'Shiva Purana', 'Hanuman Chalisa', 'Bhagavad Gita', 'Shivratri'];

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await PublicApi.getHomeData();
        const bhajans = res.data?.featuredBhajans || [];
        const puranas = res.data?.puranas || [];

        const combined = [
          ...bhajans.slice(0, 3).map((b: any) => ({
            id: b.id,
            slug: b.slug,
            title: isHindi ? b.hindi_title || b.title : b.english_title || b.title_en || b.title,
            title_en: b.english_title || b.title_en,
            type: 'BHAJAN',
            typeLabel: isHindi ? 'भजन' : 'Bhajan',
            icon: '🪔',
            url: `/bhajans/${b.slug || b.id}`
          })),
          ...puranas.slice(0, 2).map((p: any) => ({
            id: p.id,
            slug: p.slug,
            title: isHindi ? p.title : p.title_en || p.title,
            title_en: p.title_en,
            type: 'PURANA',
            typeLabel: isHindi ? 'पुराण' : 'Purana',
            icon: '📜',
            url: `/puranas/${p.slug || p.id}`
          }))
        ];

        if (combined.length > 0) {
          setPopularItems(combined);
          return;
        }
      } catch (e) {
        // Continue to fallback
      }

      // Default curated spiritual highlights
      setPopularItems([
        {
          title: isHindi ? 'राधारमणं हरे हरे भजन' : 'Radha Ramanam Hare Hare',
          title_en: 'Radha Ramanam Hare Hare',
          type: 'BHAJAN',
          typeLabel: isHindi ? 'भजन' : 'Bhajan',
          icon: '🪔',
          url: '/bhajans'
        },
        {
          title: isHindi ? 'श्रीमद्भागवत महापुराण' : 'Srimad Bhagwat Mahapuran',
          title_en: 'Srimad Bhagwat Mahapuran',
          type: 'PURANA',
          typeLabel: isHindi ? 'पुराण' : 'Purana',
          icon: '📜',
          url: '/puranas'
        },
        {
          title: isHindi ? 'शिव कैलाशों के वासी' : 'Shiv Kailasho Ke Vasi',
          title_en: 'Shiv Kailasho Ke Vasi',
          type: 'BHAJAN',
          typeLabel: isHindi ? 'भजन' : 'Bhajan',
          icon: '🔱',
          url: '/bhajans'
        },
        {
          title: isHindi ? 'वायु पुराण' : 'Vayu Purana',
          title_en: 'Vayu Purana',
          type: 'PURANA',
          typeLabel: isHindi ? 'पुराण' : 'Purana',
          icon: '📜',
          url: '/puranas'
        }
      ]);
    };

    fetchContent();
  }, [language, isHindi]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/bhajans?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const sacredPortals = [
    {
      title: isHindi ? 'मधुर भजन संग्रह' : 'Devotional Bhajans',
      desc: isHindi ? 'हृदयस्पर्शी भजन एवं कीर्तन' : 'Soulful hymns and stotrams',
      icon: <Music className="w-5 h-5 text-amber-600" />,
      bg: 'from-amber-500/10 via-orange-500/5 to-transparent',
      borderColor: 'hover:border-amber-400/60',
      tagColor: 'text-amber-700 bg-amber-100/70',
      url: '/bhajans'
    },
    {
      title: isHindi ? 'पवित्र अष्टादश पुराण' : 'Sacred Puranas',
      desc: isHindi ? 'प्रामाणिक धार्मिक ग्रंथ एवं गाथाएं' : 'Original scriptures and wisdom',
      icon: <Scroll className="w-5 h-5 text-orange-600" />,
      bg: 'from-orange-500/10 via-rose-500/5 to-transparent',
      borderColor: 'hover:border-orange-400/60',
      tagColor: 'text-orange-700 bg-orange-100/70',
      url: '/puranas'
    },
    {
      title: isHindi ? 'सनातन पर्व व व्रत' : 'Festivals & Vrats',
      desc: isHindi ? 'शुभ मुहूर्त, कथाएं और विधि' : 'Dates, rituals, and significance',
      icon: <Sparkles className="w-5 h-5 text-rose-600" />,
      bg: 'from-rose-500/10 via-pink-500/5 to-transparent',
      borderColor: 'hover:border-rose-400/60',
      tagColor: 'text-rose-700 bg-rose-100/70',
      url: '/festivals'
    },
    {
      title: isHindi ? 'देवी-देवता दर्शन' : 'Divine Deities',
      desc: isHindi ? 'स्वरूप, मंत्र व उपासना' : 'Forms, mantras, and lore',
      icon: <Flame className="w-5 h-5 text-yellow-600" />,
      bg: 'from-yellow-500/10 via-amber-500/5 to-transparent',
      borderColor: 'hover:border-yellow-400/60',
      tagColor: 'text-yellow-800 bg-yellow-100/70',
      url: '/gods'
    }
  ];

  return (
    <div className="relative w-full min-h-[90vh] bg-gradient-to-b from-[#FFFDF9] via-[#FAF5EC] to-[#F5EFEB] py-14 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center overflow-hidden">
      {/* Spiritual Mandala & Sacred Aura Watermark Background */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden">
        {/* Sanskrit 404 Background Glow */}
        <div className="absolute font-hindi-heading text-[18vw] font-black text-amber-900/[0.03] tracking-widest blur-[1px]">
          ४०४
        </div>
        {/* Radial Ambient Glow */}
        <div className="w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full bg-gradient-to-tr from-amber-400/10 via-orange-300/10 to-rose-300/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full text-center">
        {/* Floating Sacred Diya / Mandala Aura */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative inline-flex items-center justify-center mb-6"
        >
          {/* Animated concentric rings */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-rose-400/20 blur-md animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#FFF7ED] via-[#FFEDD5] to-[#FEF3C7] flex items-center justify-center shadow-lg border-2 border-amber-300/60 text-saffron">
            <span className="text-4xl filter drop-shadow-md select-none">🪔</span>
          </div>
        </motion.div>

        {/* Sacred Path Detour Tag */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-100/90 via-orange-50 to-amber-100/90 text-amber-900 border border-amber-300/70 shadow-xs mb-5 text-xs sm:text-sm font-hindi-heading font-bold tracking-wide"
        >
          <Compass className="w-4 h-4 text-saffron animate-spin-slow" />
          <span>{isHindi ? '॥ मार्ग भटकाव - पथ अभी बाकी है ॥' : '॥ A DETOUR ON THE SACRED PATH ॥'}</span>
        </motion.div>

        {/* Divine Headline with Original Font & Generous Line Spacing */}
        <motion.h1
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-extrabold text-[#111827] tracking-tight mb-5 font-hindi-heading leading-[1.35] sm:leading-[1.3] md:leading-[1.28]"
        >
          {isHindi ? (
            <>
              पृष्ठ उपलब्ध नहीं है, <br className="hidden sm:inline" />
              परंतु <span className="text-saffron">भक्ति</span> अविरल है।
            </>
          ) : (
            <>
              The page is missing, <br className="hidden sm:inline" />
              but the <span className="text-saffron">Devotion</span> remains.
            </>
          )}
        </motion.h1>

        {/* Sub-text with Balanced Line-Height */}
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="text-slate-500 text-sm sm:text-base md:text-lg mb-8 max-w-xl mx-auto font-hindi-body leading-relaxed"
        >
          {isHindi
            ? 'आप जिस लिंक पर पहुँचे हैं वह उपलब्ध नहीं है। नीचे दिए गए बॉक्स से खोजें अथवा हमारे लोकप्रिय भजनों व पुराणों का आनंद लें।'
            : "We couldn't find the exact link you clicked. Search for it below, or read one of our most popular Bhajans today."}
        </motion.p>

        {/* Elevated Search Bar with Radiant Glow */}
        <motion.form
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          onSubmit={handleSearch}
          className="relative max-w-2xl mx-auto mb-5 w-full"
        >
          <div className="relative flex items-center bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl shadow-amber-900/5 border-2 border-amber-300/80 focus-within:border-saffron focus-within:ring-4 focus-within:ring-orange-400/20 p-2 transition-all">
            <Search className="w-5 h-5 text-saffron absolute left-5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isHindi
                  ? 'श्री कृष्ण भजन, शिव तांडव, श्रीमद्भागवत खोजें...'
                  : 'Search for any Bhajan, Aarti, Scripture, or Deity...'
              }
              className="w-full h-12 sm:h-14 pl-12 pr-4 bg-transparent outline-none text-darkBrown font-medium text-sm sm:text-base placeholder:text-gray-400 font-hindi-body"
            />
            <button
              type="submit"
              className="px-6 sm:px-8 h-12 sm:h-14 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-sm sm:text-base font-hindi-heading shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0 flex items-center gap-2"
            >
              <span>{isHindi ? 'खोजें' : 'Search'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Suggestion Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs font-hindi-body text-slate-500">
            <span className="font-bold text-darkBrown flex items-center gap-1 font-hindi-heading">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {isHindi ? 'सुझाव:' : 'Popular:'}
            </span>
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSearchQuery(pill);
                  navigate(`/bhajans?search=${encodeURIComponent(pill)}`);
                }}
                className="px-2.5 py-1 rounded-full bg-white/80 hover:bg-amber-100/80 text-darkBrown border border-amber-200/60 shadow-2xs transition-all hover:border-amber-400 cursor-pointer font-medium"
              >
                {pill}
              </button>
            ))}
          </div>
        </motion.form>

        {/* Sacred Portals Sanctuary Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="mt-10 mb-10 w-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-left">
            {sacredPortals.map((portal, i) => (
              <Link
                key={i}
                to={portal.url}
                className={`relative bg-gradient-to-b ${portal.bg} bg-white p-4 rounded-2xl border border-amber-200/60 ${portal.borderColor} shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer overflow-hidden`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform">
                      {portal.icon}
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-saffron group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="font-bold text-darkBrown text-sm sm:text-base mb-1 font-hindi-heading group-hover:text-saffron transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-hindi-body line-clamp-2 leading-relaxed">{portal.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Shloka of Reassurance Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.35 }}
          className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 rounded-2xl p-5 border border-amber-300/50 max-w-2xl mx-auto mb-8 shadow-xs text-center relative overflow-hidden"
        >
          <div className="text-xs font-extrabold uppercase tracking-widest text-amber-800 font-hindi-heading mb-1.5 flex items-center justify-center gap-1.5">
            <span>🕉️</span>
            <span>{isHindi ? 'श्रीमद्भगवद्गीता पावन संदेश' : 'Sacred Reassurance from Bhagavad Gita'}</span>
          </div>
          <p className="text-sm sm:text-base font-bold text-darkBrown font-hindi-heading italic mb-1 text-amber-950">
            "अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते। तेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम्॥"
          </p>
          <p className="text-xs text-slate-600 font-hindi-body">
            {isHindi
              ? 'जो अनन्य भाव से मेरा चिंतन व भजन करते हैं, उनके योग-क्षेम का वहन मैं स्वयं करता हूँ।'
              : 'To those who are perpetually devoted and meditate on the Divine, I provide what they lack and preserve what they have.'}
          </p>
        </motion.div>

        {/* Primary Action Return to Home */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5"
        >
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-darkBrown hover:bg-black text-white font-bold text-sm sm:text-base font-hindi-heading shadow-md hover:shadow-xl transition-all cursor-pointer"
          >
            <HomeIcon className="w-4 h-4 text-amber-400" />
            <span>{isHindi ? 'मुख्य धाम लौटें (Home)' : 'Return to Sanctuary (Home)'}</span>
          </Link>
          <Link
            to="/bhajans"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-amber-50 text-darkBrown font-bold text-sm sm:text-base font-hindi-heading border border-amber-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Music className="w-4 h-4 text-saffron" />
            <span>{isHindi ? 'समस्त भजन देखें' : 'Explore All Bhajans'}</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
