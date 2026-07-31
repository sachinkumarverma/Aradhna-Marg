import React from 'react';
import { Clock, Eye, Calendar, Share2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface BhajanHeroProps {
  title: string;
  godName?: string;
  views: number;
  duration: string;
  publishDate: string;
}

export const BhajanHero: React.FC<BhajanHeroProps> = ({ title, godName, views, duration, publishDate }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-darkBrown to-[#3d2b1f] text-cream p-6 md:p-8 shadow-xl">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative z-10">
        {godName && (
          <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-orange-500 text-xs font-semibold tracking-wider uppercase mb-4">
            {godName}
          </div>
        )}

        <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white tracking-tight leading-snug mb-5">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-cream/70 mb-6">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-orange-500" />
            <span>{new Intl.NumberFormat('en-IN').format(views)} views</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>{new Date(publishDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 h-9" leftIcon={<Share2 className="w-4 h-4" />}>
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};
