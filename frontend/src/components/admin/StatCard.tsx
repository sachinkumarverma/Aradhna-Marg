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

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, colorClassName, bgClassName = "bg-gradient-to-br from-blue-50 to-indigo-50", borderClassName = "border-blue-100" }) => {
  return (
    <div className={cn("rounded-md border p-5 shadow-sm", bgClassName, borderClassName)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
        </div>
        <div className={cn("p-2 rounded-md", colorClassName || "bg-gray-100 text-gray-600")}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={cn(
            "font-medium",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.isPositive ? '+' : '-'}{trend.value}%
          </span>
          <span className="text-gray-500 ml-2">from last month</span>
        </div>
      )}
    </div>
  );
};
