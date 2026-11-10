import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, Menu, Heart, HandHeart, User, LogOut, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { useTranslation } from '@i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NavbarSearchOverlay } from '@components/search/NavbarSearchOverlay';
import { RightNavDrawer } from './RightNavDrawer';
import { TopInstallBar } from './TopInstallBar';
import { useFavorites } from '@hooks/useFavorites';
import { useUserAuth } from '@/context/UserAuthContext';
import { ENABLE_DONATIONS } from '@/constants';

interface NavbarProps {
  containerRef?: React.RefObject<HTMLElement | null>;
}

export const Navbar: React.FC<NavbarProps> = ({ containerRef }) => {
  const { language, t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { favoritesCount } = useFavorites();
  const { user, isAuthenticated, openAuthModal, logout } = useUserAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll(containerRef ? { container: containerRef as any } : undefined);
  const location = useLocation();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  // Handle outside click to close user dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Close drawer and dropdown on route change
  useEffect(() => {
    setDrawerOpen(false);
    setSearchOpen(false);
    setUserDropdownOpen(false);
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
      <header className="w-full shrink-0 z-40 flex flex-col">
        <TopInstallBar />
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full transition-all duration-300 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] border-b border-orange-100 h-16 sm:h-20 flex items-center relative"
        >
          <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              {/* Left: Brand Logo */}
              <Link to="/" aria-label="Aradhna Marg home" className="flex items-center gap-2 sm:gap-3 group shrink-0">
                <div className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] aspect-square rounded-xl overflow-hidden bg-[#041a4b] border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs shrink-0">
                  <img
                    src="/logo-96.webp"
                    alt="Aradhna Marg Logo"
                    width="96"
                    height="96"
                    decoding="async"
                    className="w-full h-full object-cover rounded-md aspect-square"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span
                    className="font-black text-[15px] sm:text-[21px] lg:text-[23px] tracking-tight text-slate-900 leading-none uppercase"
                    style={{ fontFamily: '"Rekord Antiqua", "Rekord Antiqua Semi Bold", "RekordAntiqua", Lora, serif' }}
                  >
                    ARADHNA <span className="text-saffron">MARG</span>
                  </span>
                  <span
                    className="text-[6.5px] sm:text-[8.5px] font-extrabold text-slate-700 tracking-[0.28em] sm:tracking-[0.4em] uppercase mt-0.5 sm:mt-0.5 ml-0.5"
                    style={{ fontFamily: '"Rekord Antiqua", "Rekord Antiqua Semi Bold", "RekordAntiqua", Lora, serif' }}
                  >
                    SANATAN DHARMA
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links (Visible on xl and above when space allows) */}
              <div className="hidden xl:flex items-center gap-2 2xl:gap-4">
                <ul className={`flex items-center ${isHi ? 'gap-1.5 2xl:gap-3' : 'gap-1.5 2xl:gap-3'}`}>
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <li key={link.path}>
                        <Link
                          to={link.path}
                          className={`${
                            isHi
                              ? 'text-[17px] 2xl:text-[18.5px] font-bold tracking-normal px-3 2xl:px-4'
                              : 'text-[13.5px] 2xl:text-[14.5px] font-extrabold uppercase tracking-wide px-2 2xl:px-3'
                          } font-hindi-heading transition-colors py-1.5 rounded-lg whitespace-nowrap leading-normal ${
                            isActive
                              ? isHi
                                ? 'text-saffron bg-orange-50/80 font-extrabold'
                                : 'text-saffron bg-orange-50/80 font-black'
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
              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Language Switcher (Desktop / Tablet) */}
                <div className="hidden sm:block">
                  <LanguageSwitcher />
                </div>

                {/* Support Us / Donate Button (Desktop XL) - Hidden until Razorpay approval */}
                {ENABLE_DONATIONS && (
                  <div className="hidden xl:block">
                    <Link to="/support-us">
                      <Button
                        size="sm"
                        leftIcon={<HandHeart className="w-3.5 h-3.5 text-white" />}
                        className="bg-saffron hover:brightness-90 text-white font-semibold rounded-full px-4 shadow-sm hover:shadow-md transition-all text-xs sm:text-[13px] font-lyrics cursor-pointer tracking-wide"
                      >
                        {t('navigation.supportUs')}
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Favorites Heart Navigation Button (Hidden on mobile, visible from sm up) */}
                <Link
                  to="/favourite"
                  className={`hidden sm:flex relative w-8 h-8 sm:w-10 sm:h-10 rounded-full items-center justify-center transition-all border shadow-2xs cursor-pointer active:scale-95 group shrink-0 ${
                    location.pathname === '/favourite' || location.pathname === '/favorites'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-500 border-gray-200/80'
                  }`}
                  title={isHi ? 'पसंदीदा संग्रह' : 'Saved Favorites'}
                  aria-label="Favorites"
                >
                  <Heart
                    className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 transition-transform group-hover:scale-110 ${
                      location.pathname === '/favourite' || location.pathname === '/favorites'
                        ? 'fill-white text-white'
                        : favoritesCount > 0
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-slate-700'
                    }`}
                  />
                  {favoritesCount > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 min-w-3.5 h-3.5 sm:min-w-4 sm:h-4 px-0.5 sm:px-1 rounded-full font-bold text-[8.5px] sm:text-[10px] flex items-center justify-center shadow-xs ${
                        location.pathname === '/favourite' || location.pathname === '/favorites'
                          ? 'bg-white text-rose-600'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {favoritesCount > 99 ? '99+' : favoritesCount}
                    </span>
                  )}
                </Link>

                {/* User Auth Section */}
                {isAuthenticated && user ? (
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen((prev) => !prev)}
                      className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full bg-orange-50/80 hover:bg-orange-100 border border-amber-200/80 transition-all cursor-pointer"
                      title={user.name}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-amber-300"
                        />
                      ) : (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-saffron text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="hidden md:inline font-bold text-xs text-slate-800 font-hindi-heading max-w-[90px] truncate">
                        {user.name.split(' ')[0]}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                    </button>

                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-2 border-b border-slate-100 mb-1">
                          <p className="text-xs font-bold text-slate-900 truncate font-hindi-heading leading-tight">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer text-left font-hindi-heading"
                          >
                            <LogOut className="w-3.5 h-3.5 shrink-0" />
                            <span>{isHi ? 'लॉग आउट' : 'Sign Out'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-saffron/40 bg-orange-50/70 hover:bg-orange-100 text-saffron hover:text-saffron-dark text-xs font-bold transition-all shadow-2xs font-hindi-heading cursor-pointer active:scale-95"
                      title={isHi ? 'लॉग इन' : 'Sign In'}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{isHi ? 'लॉग इन' : 'Sign In'}</span>
                    </Link>
                    <Link
                      to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                      className="sm:hidden w-8 h-8 rounded-full bg-slate-50 hover:bg-orange-50 hover:text-saffron text-slate-700 flex items-center justify-center transition-colors border border-gray-200/80 shadow-2xs cursor-pointer shrink-0"
                      title={isHi ? 'लॉग इन' : 'Sign In'}
                      aria-label="User Login"
                    >
                      <User className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}

                {/* Search Trigger Icon */}
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-50 hover:bg-orange-50 hover:text-saffron text-slate-700 flex items-center justify-center transition-colors border border-gray-200/80 shadow-2xs cursor-pointer shrink-0"
                  title={`${t('common.search')} (Ctrl+K)`}
                  aria-label={t('common.search')}
                >
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Right Sidebar Menu Toggle Button (ONLY visible when space is constrained < xl) */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#ff3b00] hover:bg-[#e03400] active:scale-95 text-white flex items-center justify-center shadow-sm hover:shadow-md transition-all cursor-pointer xl:hidden shrink-0"
                  title={isHi ? 'मेनू खोलें' : 'Open Menu'}
                  aria-label="Navigation Menu"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </motion.nav>
      </header>

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
