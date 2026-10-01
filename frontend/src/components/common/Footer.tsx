import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useTranslation } from '@i18n/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#0a0a0a] text-gray-400 pt-16 pb-8 border-t-4 border-saffron relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full overflow-hidden shadow-md bg-white">
                <img src="/logo.png" alt="Aradhna Marg Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">Aradhna Marg</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 font-hindi-body">{t('footer.aboutText')}</p>
          </div>

          {/* Links Col 1: Explore / पावन सामग्री */}
          <div>
            <h3 className="font-bold text-saffron mb-6 text-lg flex items-center gap-2 font-hindi-heading">
              <span className="text-xl">❖</span> {t('footer.sacredContent')}
            </h3>
            <ul className="space-y-3 font-medium text-sm font-hindi-body">
              <li>
                <Link to="/videos" className="hover:text-white transition-colors">
                  {t('navigation.videos')}
                </Link>
              </li>
              <li>
                <Link to="/bhajans" className="hover:text-white transition-colors">
                  {t('navigation.bhajans')}
                </Link>
              </li>
              <li>
                <Link to="/puranas" className="hover:text-white transition-colors">
                  {t('navigation.puranas')}
                </Link>
              </li>
              <li>
                <Link to="/articles" className="hover:text-white transition-colors">
                  {t('navigation.articles')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 2: Navigation / खोजें */}
          <div>
            <h3 className="font-bold text-saffron mb-6 text-lg flex items-center gap-2 font-hindi-heading">
              <span className="text-xl">❖</span> {t('navigation.explore')}
            </h3>
            <ul className="space-y-3 font-medium text-sm font-hindi-body">
              <li>
                <Link to="/gods" className="hover:text-white transition-colors">
                  {t('navigation.gods')}
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-white transition-colors">
                  {t('navigation.categories')}
                </Link>
              </li>
              <li>
                <Link to="/festivals" className="hover:text-white transition-colors">
                  {t('navigation.festivals')}
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-white transition-colors">
                  {t('common.search')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Quick Links */}
          <div>
            <h3 className="font-bold text-saffron mb-6 text-lg flex items-center gap-2 font-hindi-heading">
              <span className="text-xl">❖</span> {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-3 font-medium text-sm font-hindi-body">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  {t('navigation.home')}
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  {t('navigation.explore')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="hover:text-white transition-colors">
                  {t('footer.disclaimer')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-hindi-body">
          <p>
            © {new Date().getFullYear()} Aradhna Marg. {t('footer.copyright')}
          </p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-600 fill-red-600" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
};
