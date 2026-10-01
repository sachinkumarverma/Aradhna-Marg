import React, { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagsInputProps {
  value: string; // comma separated
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TagsInput: React.FC<TagsInputProps> = ({ value, onChange, placeholder = 'Press Enter to add tag' }) => {
  const [inputValue, setInputValue] = useState('');

  const tags = value
    ? value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag].join(', '));
        setInputValue('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove).join(', '));
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-saffron/20 focus-within:border-saffron transition-all p-2.5 flex flex-wrap items-center gap-2 min-h-[48px]">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full shadow-2xs transition-all"
        >
          <span>{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-blue-200 hover:text-white transition-colors focus:outline-none flex items-center justify-center cursor-pointer ml-0.5"
            title="Remove tag"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 outline-none min-w-[120px] text-sm px-1 py-1 bg-transparent placeholder:text-gray-400"
      />
    </div>
  );
};
