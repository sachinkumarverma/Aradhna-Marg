import React, { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, Menu, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { useTranslation } from '@i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NavbarSearchOverlay } from '@components/search/NavbarSearchOverlay';
import { RightNavDrawer } from './RightNavDrawer';

interface NavbarProps {
  containerRef?: React.RefObject<HTMLElement | null>;
}

export const Navbar: React.FC<NavbarProps> = ({ containerRef }) => {
  const { language, t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { scrollY } = useScroll(containerRef ? { container: containerRef as any } : undefined);
  const location = useLocation();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: t('navigation.bhajans'), path: '/bhajans' },
    { name: t('navigation.puranas'), path: '/puranas' },
    { name: t('navigation.categories'), path: '/categories' },
    { name: t('navigation.gods'), path: '/gods' },
    { name: t('navigation.festivals'), path: '/festivals' },
    { name: t('navigation.videos'), path: '/videos' },
    { name: language === 'hi' ? 'ज्ञान' : 'Gyan', path: '/articles' }
  ];

  const isHi = language === 'hi';

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full shrink-0 z-40 transition-all duration-300 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] border-b border-orange-100 py-3 sm:py-3.5 relative"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden bg-[#fff9f0] border border-orange-200/80 flex items-center justify-center p-1 group-hover:scale-105 transition-transform shadow-xs">
                <img src="/logo.png" alt="Aradhna Marg Logo" className="w-full h-full object-cover rounded-md" />
              </div>
              <div className="flex flex-col">
                <span
                  className="font-black text-xl sm:text-2xl lg:text-[26px] tracking-tight text-slate-900 leading-none uppercase"
                  style={{ fontFamily: '"Rekord Antiqua", "Rekord Antiqua Semi Bold", "RekordAntiqua", Lora, serif' }}
                >
                  ARADHNA <span className="text-saffron">MARG</span>
                </span>
                <span
                  className="text-[8.5px] sm:text-[9.5px] font-extrabold text-slate-500 tracking-[0.35em] sm:tracking-[0.45em] uppercase mt-1 ml-0.5"
                  style={{ fontFamily: '"Rekord Antiqua", "Rekord Antiqua Semi Bold", "RekordAntiqua", Lora, serif' }}
                >
                  SANATAN DHARMA
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (Visible on xl and above when space allows) */}
            <div className="hidden xl:flex items-center gap-2 2xl:gap-4">
              <ul className="flex items-center gap-1.5 2xl:gap-3">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className={`text-[13px] 2xl:text-[14px] font-bold font-hindi-heading tracking-[0.2px] uppercase transition-colors py-1.5 px-2.5 rounded-lg whitespace-nowrap ${
                          isActive
                            ? 'text-saffron bg-orange-50/80 font-black'
                            : 'text-slate-800 hover:text-saffron hover:bg-orange-50/40'
                        }`}
                      >
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher (Desktop / Tablet) */}
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              {/* Support Us / Donate Button (Desktop XL) */}
              <div className="hidden xl:block">
                <Link to="/support-us">
                  <Button
                    size="sm"
                    leftIcon={<Heart className="w-3.5 h-3.5 fill-white" />}
                    className="bg-saffron hover:brightness-90 text-white font-bold rounded-full px-4 shadow-sm hover:shadow-md transition-all text-xs font-hindi-heading cursor-pointer"
                    style={{ fontFamily: '"Anek Devanagari", sans-serif' }}
                  >
                    {t('navigation.supportUs')}
                  </Button>
                </Link>
              </div>

              {/* Search Trigger Icon */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 hover:bg-orange-50 hover:text-saffron text-slate-700 flex items-center justify-center transition-colors border border-gray-200/80 shadow-2xs cursor-pointer"
                title={`${t('common.search')} (Ctrl+K)`}
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Right Sidebar Menu Toggle Button (ONLY visible when space is constrained < xl) */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ff3b00] hover:bg-[#e03400] active:scale-95 text-white flex items-center justify-center shadow-sm hover:shadow-md transition-all cursor-pointer xl:hidden"
                title={isHi ? 'मेनू खोलें' : 'Open Menu'}
                aria-label="Navigation Menu"
              >
                <Menu className="w-5 h-5 text-white" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Global Navbar Search Overlay */}
      <NavbarSearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Right Sliding Navigation Drawer */}
      <RightNavDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenSearch={() => setSearchOpen(true)}
      />
    </>
  );
};
