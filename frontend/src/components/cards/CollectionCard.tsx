import React from 'react';
import { Link } from 'react-router-dom';
import { Music2 } from 'lucide-react';

interface CollectionCardProps {
  id: string | number;
  name: string;
  count?: number;
  thumbnailUrl?: string;
  type: 'category' | 'god' | 'festival';
}

export const CollectionCard: React.FC<CollectionCardProps> = ({ id, name, count, thumbnailUrl, type }) => {
  const aspectClass = type === 'god' ? 'aspect-square' : 'aspect-video';
  const targetPath = type === 'god' ? `/gods/${id}` : `/${type}s/${id}`;

  return (
    <Link
      to={targetPath}
      className="group block h-full bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-saffron/40 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      <div className={`relative ${aspectClass} bg-cream overflow-hidden border-b border-black/5`}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-saffron shadow-xs">
              <Music2 className="w-6 h-6" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-3.5 flex items-center justify-between gap-2">
        <h3 className="font-bold text-xs md:text-sm text-darkBrown truncate group-hover:text-saffron transition-colors font-hindi-body pt-0.5 leading-relaxed">
          {name}
        </h3>
        {typeof count === 'number' && count > 0 && (
          <span className="text-[11px] font-bold bg-amber-50 text-saffron px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 border border-amber-200/60">
            {count}
          </span>
        )}
      </div>
    </Link>
  );
};
