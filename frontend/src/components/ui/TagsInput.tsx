import React, { useState, type KeyboardEvent, type ClipboardEvent, type ChangeEvent } from 'react';
import { X } from 'lucide-react';

interface TagsInputProps {
  value?: string; // comma separated
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TagsInput: React.FC<TagsInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Type and press Enter, comma or paste tags...'
}) => {
  const [inputValue, setInputValue] = useState('');

  const tags = value
    ? value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const addTags = (rawInput: string) => {
    if (!rawInput.trim()) return;
    const incomingTags = rawInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (incomingTags.length === 0) return;

    const currentTags = [...tags];
    let changed = false;

    for (const tag of incomingTags) {
      // Case-insensitive check to avoid duplicate tags
      if (!currentTags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
        currentTags.push(tag);
        changed = true;
      }
    }

    if (changed) {
      onChange(currentTags.join(', '));
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const parts = val.split(',');
      const completed = parts.slice(0, -1);
      const remainder = parts[parts.length - 1];

      if (completed.length > 0) {
        addTags(completed.join(','));
      }
      setInputValue(remainder.trimStart());
    } else {
      setInputValue(val);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasteText = e.clipboardData.getData('text');
    if (pasteText.includes(',')) {
      e.preventDefault();
      const combined = (inputValue + pasteText).trim();
      addTags(combined);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTags(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTags(inputValue);
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, i) => i !== indexToRemove).join(', '));
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-saffron/20 focus-within:border-saffron transition-all p-2.5 flex flex-wrap items-center gap-2 min-h-[48px]">
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full shadow-2xs transition-all"
        >
          <span>{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(i)}
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
        onChange={handleInputChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 outline-none min-w-[140px] text-sm px-1 py-1 bg-transparent placeholder:text-gray-400"
      />
    </div>
  );
};
