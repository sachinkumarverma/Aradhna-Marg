import React, { useState, useRef, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  BookOpen,
  FileText,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft
} from 'lucide-react';

interface DedicatedPdfViewerProps {
  pdfUrl: string;
  title?: string;
  onDownload?: () => void;
  initialPage?: number;
}

export const DedicatedPdfViewer: React.FC<DedicatedPdfViewerProps> = ({
  pdfUrl,
  title = 'Sacred Scripture PDF',
  onDownload,
  initialPage = 1
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [readerTheme, setReaderTheme] = useState<'default' | 'sepia' | 'dark'>('default');
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [inputPage, setInputPage] = useState<string>(String(initialPage));

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize text input box with pageNumber unless user is currently editing
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setInputPage(String(pageNumber));
    }
  }, [pageNumber]);

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => prev + 1);
  };

  const handlePageJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputPage, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setPageNumber(parsed);
    } else {
      setInputPage(String(pageNumber));
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(console.error);
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(console.error);
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 75));
  const resetZoom = () => setZoomLevel(100);

  const getThemeFilterClass = () => {
    switch (readerTheme) {
      case 'sepia':
        return 'sepia-[0.3] hue-rotate-[-30deg] contrast-[0.95] bg-[#F4ECD8]';
      case 'dark':
        return 'invert-[0.9] hue-rotate-180 bg-slate-900';
      default:
        return 'bg-white';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : 'w-full h-[750px] my-6'
      }`}
    >
      {/* Control Toolbar */}
      <div className="bg-slate-950 text-white px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Title & Document Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-saffron/20 text-saffron flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-100 truncate max-w-xs sm:max-w-xs md:max-w-sm">{title}</h3>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Page Navigation & Jump Control */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60">
            <button
              onClick={handlePrevPage}
              title="Previous Page"
              disabled={pageNumber <= 1}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <form onSubmit={handlePageJumpSubmit} className="flex items-center gap-1 px-1">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Page</span>
              <input
                ref={inputRef}
                type="number"
                min="1"
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onBlur={handlePageJumpSubmit}
                className="w-12 h-6 bg-slate-900 text-center text-xs font-bold text-white rounded border border-slate-700 focus:border-saffron focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title="Type page number and press Enter to jump"
              />
              <button
                type="submit"
                title="Jump to Page"
                className="p-1 hover:bg-slate-700 text-slate-400 hover:text-saffron rounded transition-colors"
              >
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </form>

            <button
              onClick={handleNextPage}
              title="Next Page"
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60">
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              disabled={zoomLevel <= 75}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              title="Reset Zoom"
              className="px-2 py-0.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              {zoomLevel}%
            </button>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              disabled={zoomLevel >= 200}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Filters */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700/60">
            <button
              onClick={() => setReaderTheme('default')}
              title="Light Mode"
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                readerTheme === 'default' ? 'bg-saffron text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setReaderTheme('sepia')}
              title="Sepia Mode"
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                readerTheme === 'sepia' ? 'bg-amber-700 text-amber-100' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setReaderTheme('dark')}
              title="Night Reading"
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                readerTheme === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {onDownload && (
              <button
                onClick={onDownload}
                title="Download PDF"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-saffron text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new window"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700/60"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Reader'}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700/60"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Document Content Container */}
      <div className="flex-1 w-full bg-slate-950 overflow-auto p-4 sm:p-6 relative flex flex-col items-center">
        <div
          className="h-full min-h-[600px] w-full relative flex justify-center items-start origin-top"
          style={{
            width: zoomLevel > 100 ? `${zoomLevel}%` : '100%',
            minWidth: '100%'
          }}
        >
          <iframe
            key={`${pdfUrl}-page-${pageNumber}-zoom-${zoomLevel}`}
            src={`${pdfUrl}#page=${pageNumber}&zoom=${zoomLevel}&toolbar=0&navpanes=0&scrollbar=1`}
            title={title}
            className={`w-full h-full min-h-[600px] border-0 rounded-xl shadow-lg ${getThemeFilterClass()}`}
          />
        </div>
      </div>
    </div>
  );
};
