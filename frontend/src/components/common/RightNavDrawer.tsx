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
  HandHeart
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '@i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PublicApi } from '@api/publicApi';
import { useQuery } from '@tanstack/react-query';
import { useFavorites } from '@hooks/useFavorites';

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
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden bg-[#fff9f0] border border-orange-200/80 flex items-center justify-center p-1 shadow-xs shrink-0">
                  <img src="/logo.png" alt="Aradhna Marg" className="w-full h-full object-cover rounded-md" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm sm:text-base tracking-wider text-slate-900 uppercase font-hindi-heading leading-tight">
                    {isHi ? 'मेनू' : 'MENU'}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-saffron tracking-widest uppercase mt-0.5">
                    ARADHNA MARG
                  </span>
                </div>
              </div>

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

              {/* Support Us / Daan Card */}
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
    </AnimatePresence>,
    document.body
  );
};
