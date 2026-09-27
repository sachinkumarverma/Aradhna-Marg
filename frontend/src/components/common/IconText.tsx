import React from 'react';
import { cn } from '@utils/cn';

export interface IconTextProps extends React.HTMLAttributes<HTMLElement> {
  icon?: React.ReactNode;
  children?: React.ReactNode;
  text?: React.ReactNode;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  align?: 'center' | 'start' | 'baseline';
  gap?: string;
  as?: React.ElementType;
}

export const IconText: React.FC<IconTextProps> = ({
  icon,
  children,
  text,
  className = '',
  iconClassName = '',
  textClassName = '',
  align = 'center',
  gap = 'gap-2.5',
  as: Component = 'div',
  ...props
}) => {
  const content = children ?? text;

  const alignClass = align === 'start' ? 'items-start' : align === 'baseline' ? 'items-baseline' : 'items-center';

  return (
    <Component className={cn('inline-flex', alignClass, gap, className)} {...props}>
      {icon && (
        <span className={cn('inline-flex items-center justify-center shrink-0 icon-wrapper', iconClassName)}>
          {icon}
        </span>
      )}
      {content !== undefined && content !== null && (
        <span className={cn('min-w-0 translate-y-[2.5px]', textClassName)}>{content}</span>
      )}
    </Component>
  );
};
