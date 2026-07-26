import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CollectionHeroProps {
  title: string;
  description?: string;
  stats?: Array<{ label: string; value: string | number }>;
  breadcrumbs: Array<{ label: string; path: string }>;
  thumbnailUrl?: string;
}

export const CollectionHero: React.FC<CollectionHeroProps> = ({
  title,
  description,
  stats,
  breadcrumbs,
  thumbnailUrl
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-darkBrown to-[#3d2b1f] text-cream pt-24 pb-16 shadow-xl">
      {/* Decorative SVG Pattern */}
      <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
            <pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotPattern)" />
        </svg>
      </div>

      <div className="absolute top-0 right-1/4 w-96 h-96 bg-saffron/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-10">
        
        <div className="flex-1 w-full">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-cream/60 mb-6 flex-wrap">
            <Link to="/" className="hover:text-saffron transition-colors">Home</Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-4 h-4" />
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-white font-medium">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="hover:text-saffron transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4"
          >
            {title}
          </motion.h1>

          {description && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-cream/80 max-w-2xl leading-relaxed mb-8"
            >
              {description}
            </motion.p>
          )}

          {stats && stats.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-6"
            >
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-2xl font-bold text-saffron">{stat.value}</span>
                  <span className="text-xs uppercase tracking-wider text-cream/60 font-semibold">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Optional large featured image for God/Festival pages */}
        {thumbnailUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-sm lg:w-80 shrink-0"
          >
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-darkBrown/80 to-transparent z-10" />
              <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
