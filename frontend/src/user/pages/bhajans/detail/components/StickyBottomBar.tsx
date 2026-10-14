import React from 'react';
import { BookOpen, Download, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@utils/cn';

interface StickyBottomBarProps {
  onToggleReadingMode: () => void;
  isReadingMode: boolean;
  onCopy: () => void;
  hasCopied: boolean;
  onDownloadPdf?: () => void;
  isDownloadingPdf?: boolean;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  onToggleReadingMode,
  isReadingMode,
  onCopy,
  hasCopied,
  onDownloadPdf,
  isDownloadingPdf
}) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-40 md:hidden"
      >
        <div className="bg-white/90 backdrop-blur-xl border border-black/10 rounded-2xl p-2 shadow-2xl flex items-center justify-around">
          <button
            onClick={onToggleReadingMode}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-md flex-1 transition-colors',
              isReadingMode ? 'text-saffron bg-saffron/10' : 'text-darkBrown/70 hover:bg-black/5'
            )}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium">Read</span>
          </button>

          <button
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex flex-col items-center gap-1 p-2 rounded-md flex-1 text-darkBrown/70 hover:bg-black/5 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-5 h-5 animate-spin text-saffron" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="text-[10px] font-medium">{isDownloadingPdf ? 'Loading...' : 'PDF'}</span>
          </button>

          <button
            onClick={onCopy}
            className="flex flex-col items-center gap-1 p-2 rounded-md flex-1 text-darkBrown/70 hover:bg-black/5 transition-colors"
          >
            {hasCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            <span className="text-[10px] font-medium">{hasCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <button className="flex flex-col items-center gap-1 p-2 rounded-md flex-1 text-darkBrown/70 hover:bg-black/5 transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] font-medium">Share</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
