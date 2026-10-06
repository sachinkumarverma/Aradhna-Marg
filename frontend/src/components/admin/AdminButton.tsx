import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@utils/cn';
import { buttonTapVariant } from '@/animations/variants';

export interface AdminButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    { className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md select-none cursor-pointer';

    const variants = {
      primary: 'bg-[#ff3b00] hover:bg-[#e03400] text-white focus:ring-[#ff3b00]/50 shadow-sm shadow-[#ff3b00]/20',
      secondary: 'bg-golden text-darkBrown hover:bg-golden/90 focus:ring-golden/50',
      outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-200',
      icon: 'p-2 rounded-md hover:bg-gray-100 text-gray-700 focus:ring-gray-200',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm'
    };

    const sizes = {
      sm: 'h-9 px-3.5 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
      icon: 'h-9 w-9 p-0'
    };

    return (
      <motion.button
        ref={ref}
        variants={buttonTapVariant}
        whileHover={disabled ? {} : 'hover'}
        whileTap={disabled ? {} : 'tap'}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="inline-flex items-center justify-center shrink-0">{leftIcon}</span>}
        {children && (
          <span className="inline-flex items-center justify-center leading-normal text-center">{children as any}</span>
        )}
        {!isLoading && rightIcon && (
          <span className="inline-flex items-center justify-center shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

AdminButton.displayName = 'AdminButton';
