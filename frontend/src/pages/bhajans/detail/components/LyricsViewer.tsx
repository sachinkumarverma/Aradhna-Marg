import React from 'react';
import { cn } from '@utils/cn';

interface LyricsViewerProps {
  lyrics: string;
  fontSize: number;
  isDark: boolean;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({ lyrics, fontSize, isDark }) => {
  return (
    <div
      className={cn('whitespace-pre-wrap font-sans leading-relaxed', isDark ? 'text-white/90' : 'text-slate-700')}
      style={{ fontSize: `${fontSize}px` }}
    >
      {lyrics}
    </div>
  );
};
