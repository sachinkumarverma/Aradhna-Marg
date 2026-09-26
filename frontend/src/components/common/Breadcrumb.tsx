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
  variant?: 'light' | 'dark';
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '', variant = 'light' }) => {
  const isDark = variant === 'dark';

  return (
    <nav
      className={`flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold ${
        isDark ? 'text-slate-200' : 'text-slate-600'
      } ${className}`}
    >
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
            <ChevronRight
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isDark ? 'text-white/40' : 'text-slate-300'}`}
            />
            {isLast || !item.to ? (
              <span
                className={`font-bold truncate max-w-[200px] sm:max-w-xs md:max-w-md ${
                  isDark ? 'text-amber-400' : 'text-saffron'
                }`}
                title={item.label}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className={`transition-colors font-medium ${
                  isDark ? 'text-slate-200 hover:text-white' : 'text-slate-600 hover:text-saffron'
                }`}
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
