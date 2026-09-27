import React from 'react';
import { Link } from 'react-router-dom';

interface DeityCardProps {
  id?: string | number;
  slug?: string;
  name: string;
  image?: string;
  className?: string;
}

const getImageSrc = (deity: { name: string; image?: string }) => {
  if (deity.image && deity.image.trim()) return deity.image;
  const nameLower = (deity.name || '').toLowerCase();
  if (nameLower.includes('ganesh')) return '/Deities/Ganesh.png';
  if (nameLower.includes('krishna')) return '/Deities/Krishna.png';
  if (nameLower.includes('durga')) return '/Deities/MataDurga.png';
  if (nameLower.includes('radha')) return '/Deities/Radharamanji.png';
  if (nameLower.includes('shiv')) return '/Deities/ShivJi.png';
  if (nameLower.includes('ram')) return '/Deities/Shriram.png';
  return '/Deities/Krishna.png';
};

export const DeityCard: React.FC<DeityCardProps> = ({ id, slug, name, image, className = '' }) => {
  const deityUrl = `/gods/${slug || id}`;
  const imgSrc = getImageSrc({ name, image });

  return (
    <Link
      to={deityUrl}
      className={`group block relative w-full aspect-square rounded-xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-black/5 hover:border-saffron/40 cursor-pointer ${className}`}
    >
      {/* Background Image (Strict 1:1 Aspect Ratio) */}
      <img
        src={imgSrc}
        alt={name}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>

      {/* Tag Overlay at Bottom Center */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 h-8 rounded-lg shadow-md group-hover:bg-saffron transition-colors flex items-center justify-center">
        <span className="text-darkBrown group-hover:text-white font-bold text-xs tracking-wide uppercase whitespace-nowrap transition-colors font-hindi-body leading-tight pt-1">
          {name}
        </span>
      </div>
    </Link>
  );
};
