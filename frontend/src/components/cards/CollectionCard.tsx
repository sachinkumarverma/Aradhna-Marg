import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Music2 } from 'lucide-react';
import { Card } from '../ui/Card';

interface CollectionCardProps {
  id: string | number;
  name: string;
  count: number;
  thumbnailUrl?: string;
  type: 'category' | 'god' | 'festival';
}

export const CollectionCard: React.FC<CollectionCardProps> = ({ id, name, count, thumbnailUrl, type }) => {
  return (
    <Link to={`/${type}s/${id}`} className="block h-full">
      <Card hoverable className="h-full p-0 overflow-hidden group">
        <div className="relative aspect-[4/3] bg-cream overflow-hidden border-b border-black/5">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={name} 
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-saffron/20 to-golden/10">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-saffron shadow-sm">
                <Music2 className="w-8 h-8" />
              </div>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-bold text-darkBrown truncate group-hover:text-saffron transition-colors">
            {name}
          </h3>
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-full whitespace-nowrap">
            {count}
          </span>
        </div>
      </Card>
    </Link>
  );
};
