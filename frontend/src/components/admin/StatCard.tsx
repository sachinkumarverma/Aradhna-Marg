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
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  colorClassName,
  bgClassName = 'bg-gradient-to-br from-blue-50 to-indigo-50',
  borderClassName = 'border-blue-100'
}) => {
  return (
    <div className={cn('rounded-md border p-4 sm:p-5 shadow-sm', bgClassName, borderClassName)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h4 className="text-[22px] sm:text-2xl font-bold text-gray-900 tracking-tight">{value}</h4>
        </div>
        <div
          className={cn(
            'w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0',
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
