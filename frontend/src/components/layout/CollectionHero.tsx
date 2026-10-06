import React from 'react';
import { motion } from 'framer-motion';
import { Breadcrumb } from '@components/common/Breadcrumb';

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
    <div className="relative overflow-hidden bg-gradient-to-br from-darkBrown to-[#3d2b1f] text-cream pt-4 sm:pt-6 md:pt-10 pb-8 sm:pb-12 md:pb-14 shadow-xl">
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
          <div className="mb-3.5 sm:mb-6">
            <Breadcrumb items={breadcrumbs.map((c) => ({ label: c.label, to: c.path }))} variant="dark" />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-4 font-hindi-heading pt-1 pb-0.5"
          >
            {title}
          </motion.h1>

          {description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base sm:text-lg text-cream/85 max-w-2xl leading-relaxed mb-8 font-hindi-heading"
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
            <div className="aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border-4 border-white/10 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-darkBrown/80 to-transparent z-10" />
              <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
