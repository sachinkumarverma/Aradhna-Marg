import React, { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, Menu, X, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { useTranslation } from '@i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

import { NavbarSearchOverlay } from '@components/search/NavbarSearchOverlay';

interface NavbarProps {
  containerRef?: React.RefObject<HTMLElement | null>;
}

export const Navbar: React.FC<NavbarProps> = ({ containerRef }) => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: t('navigation.videos'), path: '/videos' },
    { name: t('navigation.bhajans'), path: '/bhajans' },
    { name: t('navigation.puranas'), path: '/puranas' },
    { name: t('navigation.categories'), path: '/categories' },
    { name: t('navigation.gods'), path: '/gods' },
    { name: t('navigation.festivals'), path: '/festivals' }
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full shrink-0 z-40 transition-all duration-300 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border-b-2 border-saffron/20 py-4 relative"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#fff9f0] border border-orange-100 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                <img src="/logo.png" alt="Aradhna Marg Logo" className="w-full h-full object-cover rounded-md" />
              </div>
              <div className="flex flex-col ml-1">
                <span
                  className="font-bold text-[28px] tracking-tight text-slate-900 leading-none uppercase"
                  style={{ fontFamily: '"Rekord Antiqua", "Rekord Antiqua Semi Bold", "RekordAntiqua", Lora, serif' }}
                >
                  ARADHNA <span className="text-saffron">MARG</span>
                </span>
                <span
                  className="text-[9.5px] font-extrabold text-slate-500 tracking-[0.45em] uppercase mt-1.2 ml-1"
                  style={{ fontFamily: '"Rekord Antiqua", "Rekord Antiqua Semi Bold", "RekordAntiqua", Lora, serif' }}
                >
                  SANATAN DHARMA
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <ul className="flex items-center gap-6">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`text-[15px] font-bold font-hindi-heading tracking-[0.5px] uppercase transition-colors ${
                        location.pathname === link.path ? 'text-[#d83515]' : 'text-[#14284b] hover:text-[#d83515]'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-3 border-l border-slate-200 pl-6 ml-2">
                <LanguageSwitcher />

                <Link to="/support-us">
                  <Button
                    size="sm"
                    leftIcon={<Heart className="w-3.5 h-3.5 fill-white" />}
                    className="bg-saffron hover:brightness-90 text-white font-bold rounded-full px-4 shadow-md hover:shadow-lg transition-all text-xs font-hindi-heading cursor-pointer"
                    style={{ fontFamily: '"Anek Devanagari", sans-serif' }}
                  >
                    {t('navigation.supportUs')}
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-orange-50 hover:text-saffron transition-colors text-slate-600 shadow-xs border border-gray-100"
                  title={`${t('common.search')} (Ctrl+K)`}
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Toggle & Language Switcher */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-orange-50 hover:text-saffron transition-colors text-slate-600"
                title={t('common.search')}
              >
                <Search className="w-4 h-4" />
              </button>
              <LanguageSwitcher />
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Navbar Search Overlay */}
      <NavbarSearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-40 bg-cream pt-24 px-4 pb-6 md:hidden overflow-y-auto"
        >
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              className="relative mb-4 block w-full text-left cursor-pointer"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                readOnly
                placeholder={t('common.searchPlaceholder')}
                className="w-full bg-white h-12 rounded-xl pl-12 pr-4 outline-none border border-orange-100 shadow-xs cursor-pointer font-hindi-heading text-sm"
              />
            </button>

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xl font-bold font-hindi-heading text-darkBrown py-3 border-b border-black/5 flex items-center justify-between"
              >
                <span>{link.name}</span>
              </Link>
            ))}

            <Link
              to="/support-us"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3.5 bg-saffron text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md font-hindi-heading mt-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>{t('navigation.supportUs')}</span>
            </Link>
          </div>
        </motion.div>
      )}
    </>
  );
};
