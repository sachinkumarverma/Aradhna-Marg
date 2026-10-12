import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClassName?: string;
  bgClassName?: string;
  borderClassName?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  colorClassName,
  bgClassName = 'bg-gradient-to-br from-blue-50 to-indigo-50',
  borderClassName = 'border-blue-100',
  onClick,
  className
}) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'rounded-md border p-4 sm:p-5 shadow-sm',
        bgClassName,
        borderClassName,
        onClick &&
          'cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.015] active:scale-[0.99] hover:border-gray-300 select-none group',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 group-hover:text-gray-700 transition-colors">
            {title}
          </p>
          <h4 className="text-[22px] sm:text-2xl font-bold text-gray-900 tracking-tight group-hover:text-black transition-colors">
            {value}
          </h4>
        </div>
        <div
          className={cn(
            'w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
            colorClassName || 'bg-gray-100 text-gray-600'
          )}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm">
          <span className={cn('font-semibold', trend.isPositive ? 'text-green-600' : 'text-red-600')}>
            {trend.isPositive ? '+' : '-'}
            {trend.value}%
          </span>
          <span className="text-gray-500 ml-2">from last month</span>
        </div>
      )}
    </div>
  );
};
