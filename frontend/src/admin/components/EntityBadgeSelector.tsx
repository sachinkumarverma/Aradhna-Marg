import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export interface EntityBadgeOption {
  value: string;
  label: string;
}

interface EntityBadgeSelectorProps {
  title: string;
  entityName?: string;
  pluralName?: string;
  options?: EntityBadgeOption[];
  values?: string[];
  onChange: (values: string[]) => void;
  isLoading?: boolean;
  allowCustom?: boolean;
  placeholder?: string;
  className?: string;
}

export const EntityBadgeSelector: React.FC<EntityBadgeSelectorProps> = ({
  title,
  entityName,
  pluralName,
  options = [],
  values = [],
  onChange,
  isLoading = false,
  allowCustom = false,
  placeholder,
  className = ''
}) => {
  const [search, setSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const safeValues = Array.isArray(values) ? values : [];
  const singular = entityName || title.toLowerCase();
  const plural = pluralName || title.toLowerCase();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Available options (excluding currently selected)
  const availableOptions = options.filter((opt) => !safeValues.includes(opt.value));

  // Filtered options based on user search query
  const filteredOptions = availableOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase().trim())
  );

  // Selected option objects (resolving value to label)
  const selectedOptions = safeValues.map((val) => {
    const found = options.find((opt) => opt.value === val);
    return found || { value: val, label: val };
  });

  const handleSelectOption = (opt: EntityBadgeOption) => {
    if (!safeValues.includes(opt.value)) {
      onChange([...safeValues, opt.value]);
    }
    setSearch('');
  };

  const handleAddCustom = (customText?: string) => {
    const text = (customText || search).trim();
    if (!text) return;

    // Check if it matches existing option
    const existing = options.find(
      (opt) => opt.label.toLowerCase() === text.toLowerCase() || opt.value.toLowerCase() === text.toLowerCase()
    );

    if (existing) {
      if (!safeValues.includes(existing.value)) {
        onChange([...safeValues, existing.value]);
      }
      setSearch('');
      setIsDropdownOpen(false);
      return;
    }

    if (allowCustom) {
      if (!safeValues.includes(text)) {
        onChange([...safeValues, text]);
      }
      setSearch('');
      setIsDropdownOpen(false);
    }
  };

  const handleRemove = (valueToRemove: string) => {
    onChange(safeValues.filter((v) => v !== valueToRemove));
  };

  const getBadgeStyle = (label: string) => {
    const lower = label.toLowerCase().trim();
    if (lower.includes('recommend')) return 'bg-[#fee2e2] text-[#b91c1c]';
    if (lower.includes('listen')) return 'bg-[#ffedd5] text-[#9a3412]';
    if (lower.includes('read') && !lower.includes('min')) return 'bg-[#dcfce7] text-[#15803d]';
    if (lower.includes('min') || lower.includes('time') || lower.includes('quick'))
      return 'bg-[#ede9fe] text-[#6b21a8]';
    if (lower.includes('editor') || lower.includes('pick') || lower.includes('crown'))
      return 'bg-[#e0f2fe] text-[#0369a1]';
    if (lower.includes('trend')) return 'bg-[#fce7f3] text-[#be123c]';
    if (lower.includes('feature')) return 'bg-[#fef9c3] text-[#854d0e]';

    // Harmonious pastel palettes for general tags & entities
    const palettes = [
      'bg-[#e0e7ff] text-[#4338ca]',
      'bg-[#ccfbf1] text-[#0f766e]',
      'bg-[#fef3c7] text-[#b45309]',
      'bg-[#e0f2fe] text-[#0369a1]',
      'bg-[#fce7f3] text-[#be123c]',
      'bg-[#ede9fe] text-[#6d28d9]',
      'bg-[#ffedd5] text-[#c2410c]',
      'bg-[#dcfce7] text-[#166534]',
      'bg-[#fae8ff] text-[#86198f]'
    ];
    const hash = label.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return palettes[hash % palettes.length];
  };

  const hasExactMatch = options.some((opt) => opt.label.toLowerCase() === search.trim().toLowerCase());

  return (
    <div
      className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md shadow-sm border border-blue-100 p-6 space-y-5 ${className}`}
    >
      {/* 1. Header */}
      <div className="flex items-start justify-between border-b pb-3">
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>

      {/* 2. Searchable Dropdown Bar */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-24 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-xs cursor-text"
            placeholder={
              isDropdownOpen
                ? `Type to filter ${title.toLowerCase()}...`
                : placeholder || `Select ${title.toLowerCase()} (${availableOptions.length} available)...`
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onClick={() => setIsDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (
                  filteredOptions.length === 1 &&
                  !search.trim().toLowerCase().includes(filteredOptions[0].label.toLowerCase())
                ) {
                  handleSelectOption(filteredOptions[0]);
                } else if (allowCustom) {
                  handleAddCustom();
                }
              } else if (e.key === 'Escape') {
                setIsDropdownOpen(false);
              }
            }}
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {allowCustom && search.trim() ? (
              <button
                type="button"
                onClick={() => handleAddCustom()}
                className="px-3 py-1.5 bg-[#5d6bf8] hover:bg-[#4d5cf6] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                title={`Add ${singular}`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
                <span>Add</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors cursor-pointer"
                title={isDropdownOpen ? 'Close dropdown' : `Show all ${title.toLowerCase()}`}
              >
                {isDropdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto scrollbar-thin animate-in fade-in-50 zoom-in-95 duration-150">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-gray-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-indigo-600" />
                Loading {title.toLowerCase()} from database...
              </div>
            ) : availableOptions.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-xs text-gray-600 font-semibold">
                  All available {title.toLowerCase()} are currently selected
                </p>
                {allowCustom && <p className="text-[11px] text-gray-400 mt-1">Type above to add a custom {singular}</p>}
              </div>
            ) : filteredOptions.length > 0 ? (
              <div>
                <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-500 sticky top-0 z-10">
                  <span>
                    {search.trim()
                      ? `Matching (${filteredOptions.length})`
                      : `Available Database ${title} (${filteredOptions.length})`}
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">Click to select</span>
                </div>
                <div className="p-1 space-y-0.5">
                  {filteredOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className="w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50/80 hover:text-indigo-900 rounded-lg flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 group-hover:scale-125 transition-transform shrink-0" />
                        <span className="font-medium text-gray-800 group-hover:text-indigo-950">{opt.label}</span>
                      </div>
                      <span className="text-[11px] text-indigo-600 opacity-0 group-hover:opacity-100 font-semibold flex items-center gap-1 transition-opacity">
                        <Plus className="w-3 h-3 stroke-[2.5]" /> Select
                      </span>
                    </button>
                  ))}

                  {/* Option to create custom if allowed and not an exact match */}
                  {allowCustom && search.trim() && !hasExactMatch && (
                    <div className="pt-1 mt-1 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleAddCustom()}
                        className="w-full text-left px-3 py-2 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
                        <span>Add "{search.trim()}" (for this article)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 text-center">
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  No existing {singular} matches "{search}"
                </p>
                {allowCustom ? (
                  <button
                    type="button"
                    onClick={() => handleAddCustom()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.8]" /> Add "{search}" (for this article)
                  </button>
                ) : (
                  <p className="text-[11px] text-gray-400">
                    Please choose from the available {title.toLowerCase()} in the database.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Selected Items Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">Selected {title}</span>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
            {selectedOptions.length} {selectedOptions.length === 1 ? singular : plural}
          </span>
        </div>

        {selectedOptions.length === 0 ? (
          <div className="py-4 px-3 bg-gray-50/60 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
            No {title.toLowerCase()} selected yet. Open the dropdown above to pick from your database.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {selectedOptions.map((opt) => {
              const badgeStyle = getBadgeStyle(opt.label);
              return (
                <div
                  key={opt.value}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-xs font-semibold transition-all ${badgeStyle}`}
                >
                  <span className="leading-tight">{opt.label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(opt.value)}
                    className="ml-0.5 p-0.5 hover:bg-black/10 rounded-full transition-colors text-current opacity-60 hover:opacity-100 cursor-pointer"
                    title={`Remove ${opt.label}`}
                  >
                    <X className="w-3 h-3 stroke-[2.2]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
