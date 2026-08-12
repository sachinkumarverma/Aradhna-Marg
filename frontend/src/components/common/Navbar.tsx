import React, { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, Menu, X, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@components/ui/Button';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Videos', path: '/videos' },
    { name: 'Bhajans', path: '/bhajans' },
    { name: 'Categories', path: '/categories' },
    { name: 'Gods', path: '/gods' },
    { name: 'Festivals', path: '/festivals' }
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border-b-2 border-saffron/20 py-4"
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
                  className="font-semibold text-[28px] tracking-tight text-slate-900 leading-none uppercase"
                  style={{ fontFamily: '"Rekord Antiqua", "Rekord Antiqua Semi Bold", "RekordAntiqua", Lora, serif' }}
                >
                  ARADHNA <span className="text-saffron">MARG</span>
                </span>
                <span
                  className="text-[9.5px] font-extrabold text-slate-400 tracking-[0.45em] uppercase mt-1.2 ml-1"
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
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className={`text-[13.5px] font-bold tracking-[1.5px] uppercase transition-colors ${
                        location.pathname === link.path ? 'text-[#d83515]' : 'text-[#14284b] hover:text-[#d83515]'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-4 border-l border-slate-200 pl-6 ml-2">
                <Button className="bg-saffron hover:brightness-90 text-white font-bold rounded-full px-6 py-2.5 shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                  <Heart className="w-4 h-4 fill-white" /> Support Us
                </Button>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-orange-50 hover:text-saffron transition-colors text-slate-600">
                  <Search className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-40 bg-cream pt-24 px-4 pb-6 md:hidden overflow-y-auto"
        >
          <div className="flex flex-col gap-4">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bhajans, gods..."
                className="w-full bg-white h-12 rounded-md pl-12 pr-4 outline-none focus:ring-2 focus:ring-saffron shadow-sm"
              />
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-2xl font-bold text-darkBrown py-3 border-b border-black/5"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
};
