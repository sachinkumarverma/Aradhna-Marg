import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 ${className}`}>
      {/* Red Circular Home Icon */}
      <Link
        to="/"
        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-saffron text-white hover:bg-orange-600 transition-colors shadow-sm shrink-0"
        title="होम (Home)"
      >
        <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 shrink-0" />
            {isLast || !item.to ? (
              <span
                className="text-saffron font-bold truncate max-w-[200px] sm:max-w-xs md:max-w-md"
                title={item.label}
              >
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="hover:text-saffron transition-colors text-slate-600 font-medium">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
