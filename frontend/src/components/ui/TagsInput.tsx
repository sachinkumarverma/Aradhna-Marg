import React, { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagsInputProps {
  value: string; // comma separated
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TagsInput: React.FC<TagsInputProps> = ({ value, onChange, placeholder = 'Press Enter to add tag' }) => {
  const [inputValue, setInputValue] = useState('');

  const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];

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
    onChange(tags.filter(t => t !== tagToRemove).join(', '));
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-saffron/20 focus-within:border-saffron transition-all p-1 flex flex-wrap gap-1 min-h-[42px]">
      {tags.map((tag, i) => (
        <span key={i} className="flex items-center gap-0.5 px-1.5 py-px bg-orange-50 text-orange-700 border border-orange-200 text-xs rounded font-medium">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 outline-none min-w-[120px] text-sm px-2 py-1 bg-transparent"
      />
    </div>
  );
};
