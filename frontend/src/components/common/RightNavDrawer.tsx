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
  Crown
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '@i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PublicApi } from '@api/publicApi';
import { useQuery } from '@tanstack/react-query';

interface RightNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}

export const RightNavDrawer: React.FC<RightNavDrawerProps> = ({ isOpen, onClose, onOpenSearch }) => {
  const { language, t, getLocalizedField } = useTranslation();
  const location = useLocation();

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
        path: `/bhajans?deity=${d.slug || d.id}`,
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
        path: `/bhajans?category=${c.slug || c.id}`
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
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#fffdfa] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center p-1 shadow-xs">
                  <img src="/logo.png" alt="Aradhna Marg" className="w-full h-full object-cover rounded-md" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm tracking-wider text-slate-900 uppercase font-hindi-heading">
                    {isHi ? 'मेनू' : 'MENU'}
                  </span>
                  <span className="text-[10px] font-semibold text-saffron tracking-widest uppercase">ARADHNA MARG</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-saffron flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title={isHi ? 'बंद करें' : 'Close'}
              >
                <X className="w-5 h-5" />
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
                        className={`rounded-xl border transition-all overflow-hidden ${
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
                              className="px-3.5 pb-3 pt-1 border-t border-orange-100/60 space-y-1.5"
                            >
                              <div className="grid grid-cols-2 gap-1.5 pt-1">
                                {item.items?.map((sub: any, sIdx: number) => (
                                  <Link
                                    key={sIdx}
                                    to={sub.path}
                                    onClick={onClose}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-white hover:bg-orange-50 text-xs font-semibold text-slate-700 hover:text-saffron border border-gray-100/80 transition-colors truncate"
                                  >
                                    {sub.image && (
                                      <img
                                        src={sub.image}
                                        alt={sub.name}
                                        className="w-5 h-5 rounded-md object-cover shrink-0"
                                      />
                                    )}
                                    <span className="truncate">{sub.name}</span>
                                  </Link>
                                ))}
                              </div>

                              {item.viewAllPath && (
                                <Link
                                  to={item.viewAllPath}
                                  onClick={onClose}
                                  className="mt-2 block text-center py-2 text-xs font-bold text-saffron hover:underline font-hindi-heading"
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

              {/* Support Us / Daan Card */}
              <div className="pb-2">
                <Link
                  to="/support-us"
                  onClick={onClose}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 shadow-xs hover:shadow-sm transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5 text-amber-600" />
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
