import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronDown,
  Search,
  Sparkles,
  BookOpen,
  Music2,
  Scroll,
  Calendar,
  Video,
  Layers,
  Crown,
  Heart,
  HandHeart,
  Download,
  Smartphone
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '@i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PublicApi } from '@api/publicApi';
import { useQuery } from '@tanstack/react-query';
import { useFavorites } from '@hooks/useFavorites';
import { usePWAInstall } from '@hooks/usePWAInstall';
import toast from 'react-hot-toast';
import { ENABLE_DONATIONS } from '@/constants';

interface RightNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}

export const RightNavDrawer: React.FC<RightNavDrawerProps> = ({ isOpen, onClose, onOpenSearch }) => {
  const { language, t, getLocalizedField } = useTranslation();
  const location = useLocation();
  const { favoritesCount } = useFavorites();

  // Accordion states for dropdown items
  const [openAccordion, setOpenAccordion] = useState<'deities' | 'categories' | null>(null);

  // Fetch deities and categories for drawer sub-menus
  const { data: deities = [] } = useQuery({
    queryKey: ['drawer-deities', language],
    queryFn: () => PublicApi.getDeities(),
    staleTime: 5 * 60 * 1000,
    enabled: isOpen
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['drawer-categories', language],
    queryFn: () => PublicApi.getCategories(),
    staleTime: 5 * 60 * 1000,
    enabled: isOpen
  });

  // Close on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isHi = language === 'hi';
  const { isInstalled, hasNativePrompt, isIOS, showIOSPrompt, setShowIOSPrompt, installApp } = usePWAInstall();

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      await installApp();
      onClose();
    } else if (isIOS) {
      setShowIOSPrompt(true);
    } else {
      toast(
        isHi
          ? 'ब्राउज़र मेनू (⋮) पर टैप करें और "Add to Home screen" चुनें।'
          : 'Tap browser menu (⋮) and choose "Add to Home screen" or "Install app".',
        {
          id: 'pwa-install-instruction',
          icon: '📲',
          position: 'bottom-center',
          duration: 4500,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: '16px',
            padding: '12px 18px',
            fontSize: '13.5px',
            fontWeight: 500,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            maxWidth: '92vw',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            zIndex: 99999
          }
        }
      );
    }
  };

  const navItems = [
    {
      id: 'home',
      name: isHi ? 'होम' : 'Home',
      path: '/',
      icon: <Sparkles className="w-5 h-5 text-saffron" />,
      type: 'link'
    },
    {
      id: 'deities',
      name: isHi ? 'देवी-देवता' : 'Deities',
      path: '/gods',
      icon: <Crown className="w-5 h-5 text-amber-500" />,
      type: 'accordion',
      items: deities.slice(0, 6).map((d: any) => ({
        name: getLocalizedField(d, 'name') || d.name,
        path: `/gods/${d.slug || d.id}`,
        image: d.image || d.thumbnail_url || '/Deities/Krishna.png'
      })),
      viewAllText: isHi ? 'सभी देवी-देवता देखें' : 'View All Deities',
      viewAllPath: '/gods'
    },
    {
      id: 'categories',
      name: isHi ? 'श्रेणियाँ' : 'Categories',
      path: '/categories',
      icon: <Layers className="w-5 h-5 text-blue-500" />,
      type: 'accordion',
      items: categories.slice(0, 8).map((c: any) => ({
        name: getLocalizedField(c, 'name') || c.name,
        path: `/categories/${c.slug || c.id}`
      })),
      viewAllText: isHi ? 'सभी श्रेणियाँ देखें' : 'View All Categories',
      viewAllPath: '/categories'
    },
    {
      id: 'bhajans',
      name: isHi ? 'भजन संग्रह' : 'Bhajans',
      path: '/bhajans',
      icon: <Music2 className="w-5 h-5 text-red-500" />,
      type: 'link'
    },
    {
      id: 'gyan',
      name: isHi ? 'ज्ञान व लेख' : 'Gyan & Articles',
      path: '/articles',
      icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
      type: 'link'
    },
    {
      id: 'puranas',
      name: isHi ? 'पुराण व पवित्र ग्रंथ' : 'Puranas & Granth',
      path: '/puranas',
      icon: <Scroll className="w-5 h-5 text-amber-600" />,
      type: 'link'
    },
    {
      id: 'festivals',
      name: isHi ? 'पर्व व त्यौहार' : 'Festivals',
      path: '/festivals',
      icon: <Calendar className="w-5 h-5 text-orange-500" />,
      type: 'link'
    },
    {
      id: 'videos',
      name: isHi ? 'वीडियो' : 'Videos',
      path: '/videos',
      icon: <Video className="w-5 h-5 text-purple-500" />,
      type: 'link'
    }
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex justify-end">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Right Sliding Drawer Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-[82vw] sm:w-[360px] max-w-[380px] bg-white h-full shadow-[-10px_0_30px_rgba(0,0,0,0.25)] rounded-none flex flex-col z-10 overflow-hidden border-l border-orange-100/60"
          >
            {/* Header - Height and padding matched precisely to Main Navbar */}
            <div className="flex items-center justify-between px-4 sm:px-6 h-16 sm:h-20 border-b border-orange-100 bg-white shrink-0">
              <Link to="/" onClick={onClose} className="flex items-center gap-2 sm:gap-3 group">
                <div className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] aspect-square rounded-xl overflow-hidden bg-[#041a4b] border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs shrink-0">
                  <img
                    src="/logo.png"
                    alt="Aradhna Marg Logo"
                    className="w-full h-full object-cover rounded-md aspect-square"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span
                    className="font-black text-[16px] sm:text-[18px] tracking-tight text-slate-900 leading-none uppercase"
                    style={{ fontFamily: '"Rekord Antiqua", "Rekord Antiqua Semi Bold", "RekordAntiqua", Lora, serif' }}
                  >
                    ARADHNA <span className="text-saffron">MARG</span>
                  </span>
                  <span
                    className="text-[7px] sm:text-[8px] font-extrabold text-slate-500 tracking-[0.3em] uppercase mt-1 ml-0.5"
                    style={{ fontFamily: '"Rekord Antiqua", "Rekord Antiqua Semi Bold", "RekordAntiqua", Lora, serif' }}
                  >
                    SANATAN DHARMA
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 hover:bg-orange-50 hover:text-saffron text-slate-700 flex items-center justify-center transition-colors border border-gray-200/80 shadow-2xs cursor-pointer shrink-0"
                title={isHi ? 'बंद करें' : 'Close'}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
              {/* Quick Search Card Trigger */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-orange-50/60 border border-gray-200/80 rounded-xl text-slate-500 hover:text-saffron transition-all text-sm font-hindi-heading shadow-xs cursor-pointer"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span className="truncate">{t('common.searchPlaceholder')}</span>
              </button>

              {/* Navigation Pill Cards */}
              <div className="space-y-2 pt-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;

                  if (item.type === 'accordion') {
                    const isAccordionOpen = openAccordion === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border transition-all ${
                          isAccordionOpen
                            ? 'border-saffron/30 bg-orange-50/30 shadow-xs'
                            : 'border-gray-100 bg-white hover:border-gray-200 shadow-xs'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenAccordion(isAccordionOpen ? null : (item.id as any))}
                          className="w-full flex items-center justify-between px-4 py-3 text-left font-bold text-slate-800 text-[15px] font-hindi-heading cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="shrink-0">{item.icon}</span>
                            <span>{item.name}</span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                              isAccordionOpen ? 'rotate-180 text-saffron' : ''
                            }`}
                          />
                        </button>

                        {/* Accordion sub-menu */}
                        <AnimatePresence>
                          {isAccordionOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="px-3 pb-3 pt-1 border-t border-orange-100/60 space-y-1.5"
                            >
                              <div className="grid grid-cols-2 gap-2 pt-1.5">
                                {item.items?.map((sub: any, sIdx: number) => (
                                  <Link
                                    key={sIdx}
                                    to={sub.path}
                                    onClick={onClose}
                                    className="flex items-center justify-start text-left pl-3 pr-2.5 py-2 min-h-[42px] rounded-xl bg-white hover:bg-orange-50/80 active:bg-orange-100 border border-gray-200/80 hover:border-orange-200 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] group/sub cursor-pointer"
                                  >
                                    {sub.image && (
                                      <img
                                        src={sub.image}
                                        alt={sub.name}
                                        className="w-5 h-5 rounded-md object-cover shrink-0 mr-2 group-hover/sub:scale-105 transition-transform"
                                      />
                                    )}
                                    <span className="truncate min-w-0 font-hindi-heading text-[11.5px] font-semibold leading-relaxed text-slate-700 group-hover/sub:text-saffron">
                                      {sub.name}
                                    </span>
                                  </Link>
                                ))}
                              </div>

                              {item.viewAllPath && (
                                <Link
                                  to={item.viewAllPath}
                                  onClick={onClose}
                                  className="mt-2.5 block text-center py-2 text-xs font-bold text-saffron hover:underline font-hindi-heading"
                                >
                                  {item.viewAllText} &rarr;
                                </Link>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all shadow-xs ${
                        isActive
                          ? 'border-saffron bg-orange-50 text-saffron font-bold'
                          : 'border-gray-100 bg-white hover:border-orange-200 text-slate-800 font-semibold hover:text-saffron'
                      } text-[15px] font-hindi-heading`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="shrink-0">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-saffron' : 'text-slate-300'}`} />
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4" />

              {/* Install App / Add to Home Screen Action */}
              {!isInstalled && (
                <div className="pb-2">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50/90 to-amber-50/90 hover:from-orange-100 hover:to-amber-100 shadow-2xs hover:shadow-xs transition-all group cursor-pointer text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-saffron flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-white shadow-xs">
                      <Download className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900 font-hindi-heading leading-tight">
                          {isHi ? 'ऐप इंस्टॉल करें' : 'Install App'}
                        </p>
                        <span className="px-1.5 py-0.2 rounded-full bg-saffron text-white font-bold text-[9px] uppercase tracking-wide">
                          Add to Home
                        </span>
                      </div>
                      <p className="text-[11px] text-saffron-dark truncate font-hindi-heading mt-0.5 font-medium">
                        {isHi ? 'बिना ब्राउज़र तेज़ अनुभव के लिए' : 'Fast, fullscreen offline experience'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-saffron group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </div>
              )}

              {/* Favorites Action Link */}
              <div className="pb-2">
                <Link
                  to="/favourite"
                  onClick={onClose}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 shadow-xs hover:shadow-sm transition-all group cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-rose-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-rose-500">
                    <Heart className="w-5 h-5 fill-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-900 font-hindi-heading leading-tight">
                        {isHi ? 'पसंदीदा संग्रह' : 'Saved Favorites'}
                      </p>
                      {favoritesCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold text-[10px]">
                          {favoritesCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-rose-700 truncate font-hindi-heading mt-0.5">
                      {isHi ? 'आपके सहेजे गए भजन, वीडियो व लेख' : 'Your saved bhajans, videos & scriptures'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400 group-hover:text-rose-600 transition-colors shrink-0" />
                </Link>
              </div>

              {/* Support Us / Daan Card - Hidden until Razorpay approval */}
              {ENABLE_DONATIONS && (
                <div className="pb-2">
                  <Link
                    to="/support-us"
                    onClick={onClose}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 shadow-xs hover:shadow-sm transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <HandHeart className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 font-hindi-heading leading-tight">
                        {t('navigation.supportUs')}
                      </p>
                      <p className="text-[11px] text-amber-700 truncate font-hindi-heading mt-0.5">
                        {isHi ? 'सनातन धर्म प्रचार में सहयोग दें' : 'Contribute to Sanatan Dharma'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors shrink-0" />
                  </Link>
                </div>
              )}
            </div>

            {/* Footer Language Switcher Bar */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-[#fffdfa] flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-slate-500 font-hindi-heading">
                {isHi ? 'भाषा चुनें:' : 'Language:'}
              </span>
              <LanguageSwitcher />
            </div>
          </motion.div>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSPrompt && (
        <div
          className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setShowIOSPrompt(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2 font-hindi-heading">
                <Smartphone className="w-5 h-5 text-saffron" />
                {isHi ? 'iPhone / iPad पर इंस्टॉल करें' : 'Install on iPhone / iPad'}
              </h4>
              <button
                type="button"
                onClick={() => setShowIOSPrompt(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-600 font-hindi-body">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-saffron font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  {isHi ? (
                    <>
                      Safari में नीचे मौजूद <strong>Share (शेयर)</strong> बटन पर टैप करें।
                    </>
                  ) : (
                    <>
                      Tap the <strong>Share</strong> button in Safari's bottom toolbar.
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-saffron font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  {isHi ? (
                    <>
                      नीचे स्क्रॉल करें और <strong>'Add to Home Screen'</strong> (होम स्क्रीन में जोड़ें) चुनें।
                    </>
                  ) : (
                    <>
                      Scroll down and select <strong>'Add to Home Screen'</strong>.
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-saffron font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  {isHi ? (
                    <>
                      ऊपर दाईं ओर <strong>'Add'</strong> पर टैप करें।
                    </>
                  ) : (
                    <>
                      Tap <strong>'Add'</strong> in the top right corner.
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSPrompt(false)}
              className="w-full py-2.5 bg-saffron hover:bg-saffron-dark text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
            >
              {isHi ? 'समझ गया' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
