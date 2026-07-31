import React from 'react';
import { Minus, Plus, Moon, Sun, Play, Square } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface ReadingControlsProps {
  fontSize: number;
  canIncrease: boolean;
  canDecrease: boolean;
  onIncreaseFont: () => void;
  onDecreaseFont: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  isScrolling: boolean;
  onToggleScroll: () => void;
  scrollSpeed: number;
  onChangeSpeed: (speed: 1 | 2 | 3) => void;
}

export const ReadingControls: React.FC<ReadingControlsProps> = ({
  fontSize,
  canIncrease,
  canDecrease,
  onIncreaseFont,
  onDecreaseFont,
  isDark,
  onToggleDark,
  isScrolling,
  onToggleScroll,
  scrollSpeed,
  onChangeSpeed,
}) => {
  return (
    <div className="sticky top-24 z-30 bg-white/80 backdrop-blur-lg border border-black/5 rounded-2xl p-4 shadow-sm mb-8 flex flex-wrap items-center justify-between gap-4">
      
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button variant="ghost" size="icon" onClick={onDecreaseFont} disabled={!canDecrease} className="h-8 w-8 rounded-md">
            <Minus className="w-4 h-4" />
          </Button>
          <span className="w-10 text-center text-sm font-medium">{fontSize}px</span>
          <Button variant="ghost" size="icon" onClick={onIncreaseFont} disabled={!canIncrease} className="h-8 w-8 rounded-md">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-200"></div>

        <Button variant="ghost" size="icon" onClick={onToggleDark} className="rounded-lg hover:bg-gray-100">
          {isDark ? <Sun className="w-5 h-5 text-golden" /> : <Moon className="w-5 h-5 text-darkBrown" />}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-darkBrown/60 hidden sm:inline-block">Auto Scroll</span>
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleScroll}
            className={`h-8 px-3 rounded-md flex items-center gap-2 ${isScrolling ? 'bg-saffron text-white hover:bg-saffron/90 hover:text-white' : ''}`}
          >
            {isScrolling ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isScrolling ? 'Stop' : 'Play'}
          </Button>
          
          <div className="flex items-center px-2 gap-1">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s as 1 | 2 | 3)}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${scrollSpeed === s ? 'bg-white shadow text-saffron' : 'text-gray-500 hover:text-darkBrown'}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
