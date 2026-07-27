import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  error?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchable = true,
  className,
  error
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

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('relative w-full text-sm', className)} ref={wrapperRef}>
      <div
        className={cn(
          'flex items-center justify-between w-full px-3 py-2.5 bg-white border rounded-lg cursor-pointer transition-colors',
          isOpen ? 'border-saffron ring-2 ring-saffron/20' : 'border-gray-200 hover:border-gray-300',
          error && 'border-red-500 ring-2 ring-red-500/20'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn('truncate', !selectedOption && 'text-gray-400')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {searchable && (
            <div className="flex items-center px-3 py-2 border-b border-gray-100 bg-white">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                className="w-full bg-transparent outline-none text-sm placeholder-gray-400"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">No options found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50',
                    value === opt.value && 'bg-saffron/5 text-saffron font-medium'
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check className="w-4 h-4" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
