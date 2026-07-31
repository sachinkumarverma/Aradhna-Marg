import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@utils/cn';
import type { SelectOption } from './Select';

interface MultiSelectProps {
  options: SelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  values,
  onChange,
  placeholder = 'Select options...',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) => opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOptions = options.filter((opt) => values.includes(opt.value));

  const toggleOption = (value: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  return (
    <div className={cn('relative w-full text-sm', className)} ref={wrapperRef}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 w-full px-3 py-2 min-h-[44px] bg-white border rounded-lg cursor-text transition-colors border-gray-200 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/20'
        )}
        onClick={() => setIsOpen(true)}
      >
        {selectedOptions.length === 0 && !search && (
          <span className="text-gray-400 absolute left-3 select-none pointer-events-none">{placeholder}</span>
        )}
        
        {selectedOptions.map((opt) => (
          <span
            key={opt.value}
            className="flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-md text-gray-700 text-xs font-medium shadow-sm z-10"
          >
            {opt.label}
            <button
              type="button"
              onClick={(e) => toggleOption(opt.value, e)}
              className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          type="text"
          className="flex-1 min-w-[60px] bg-transparent outline-none text-sm z-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        
        <div className="absolute right-3 flex items-center gap-1">
          {values.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="p-1 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform cursor-pointer', isOpen && 'rotate-180')} onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">No options found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = values.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    className={cn(
                      'flex items-center px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50',
                      isSelected && 'bg-saffron/5'
                    )}
                    onClick={() => {
                      toggleOption(opt.value);
                      setSearch('');
                    }}
                  >
                    <div className={cn(
                      "w-4 h-4 border rounded mr-3 flex items-center justify-center transition-colors",
                      isSelected ? "bg-saffron border-saffron" : "border-gray-300"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={cn("truncate", isSelected ? 'font-medium text-saffron' : 'text-gray-700')}>{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
