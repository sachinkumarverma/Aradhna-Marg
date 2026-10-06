import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Maximize2,
  Minimize2,
  Download,
  Sun,
  Moon,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  Loader2
} from 'lucide-react';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure pdfjs worker locally via Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

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
  const [readerTheme, setReaderTheme] = useState<'default' | 'sepia' | 'dark'>('default');
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [inputPage, setInputPage] = useState<string>(String(initialPage));

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Synchronize text input box with pageNumber unless user is currently editing
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setInputPage(String(pageNumber));
    }
  }, [pageNumber]);

  // Load PDF with PDF.js
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    const loadPdf = async () => {
      try {
        let targetUrl = pdfUrl;
        if (pdfUrl.startsWith('http') && !pdfUrl.includes(window.location.hostname)) {
          targetUrl = `/api/public/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`;
        }

        const loadingTask = pdfjsLib.getDocument({
          url: targetUrl,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true
        });

        const doc = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load PDF using PDF.js:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  // Render current page to canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale: 1.5 });
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page canvas:', err);
        }
      }
    };

    renderPage();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber]);

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => (totalPages > 0 ? Math.min(totalPages, prev + 1) : prev + 1));
  };

  const handlePageJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputPage, 10);
    if (!isNaN(parsed) && parsed > 0 && (totalPages === 0 || parsed <= totalPages)) {
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

  const getThemeFilterClass = () => {
    switch (readerTheme) {
      case 'sepia':
        return 'sepia-[0.35] hue-rotate-[-30deg] contrast-[0.95] bg-[#F4ECD8]';
      case 'dark':
        return 'invert-[0.9] hue-rotate-180 bg-slate-900';
      default:
        return 'bg-white';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : 'w-full h-[750px] my-6'
      }`}
    >
      {/* Control Toolbar */}
      <div className="bg-slate-950 text-white px-3 sm:px-4 py-2 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 shrink-0">
        {/* Row 1 on Mobile: Document Title on Left + Action Buttons on Right | Desktop: Left Side Title */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 w-full sm:w-auto min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-saffron/20 text-saffron flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[160px] xs:max-w-[220px] sm:max-w-xs md:max-w-sm">
                {title}
              </h3>
            </div>
          </div>

          {/* Action Buttons: Mobile visible here on the right */}
          <div className="flex sm:hidden items-center gap-2 shrink-0">
            {onDownload && (
              <button
                onClick={onDownload}
                title="Download PDF"
                className="h-8 w-8 flex items-center justify-center bg-saffron text-white rounded-lg hover:bg-orange-600 transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Reader'}
              className="h-8 w-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700/60 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Row 2 on Mobile (Page jump + Theme Switchers) | Desktop Right Side Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Page Navigation & Jump Control */}
          <div className="h-8 flex items-center bg-slate-800/80 rounded-lg px-1.5 border border-slate-700/60 gap-0.5">
            <button
              onClick={handlePrevPage}
              title="Previous Page"
              disabled={pageNumber <= 1}
              className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <form onSubmit={handlePageJumpSubmit} className="flex items-center gap-1 px-1">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline translate-y-[1px]">Page</span>
              <input
                ref={inputRef}
                type="number"
                min="1"
                max={totalPages || undefined}
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onBlur={handlePageJumpSubmit}
                className="w-8 h-6 bg-slate-900 text-center text-xs font-bold text-white rounded border border-slate-700 focus:border-saffron focus:outline-none leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title="Type page number and press Enter to jump"
              />
              {totalPages > 0 && (
                <span className="text-[11px] text-slate-400 font-medium translate-y-[1px]">/ {totalPages}</span>
              )}
              <button
                type="submit"
                title="Jump to Page"
                className="w-5 h-5 hidden xs:flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-saffron rounded transition-colors cursor-pointer"
              >
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </form>

            <button
              onClick={handleNextPage}
              title="Next Page"
              disabled={totalPages > 0 && pageNumber >= totalPages}
              className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 rounded text-slate-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme Filters */}
          <div className="flex h-8 items-center bg-slate-800/80 rounded-lg p-1 gap-1 border border-slate-700/60">
            <button
              onClick={() => setReaderTheme('default')}
              title="Light Mode"
              className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-colors cursor-pointer ${
                readerTheme === 'default' ? 'bg-saffron text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 shrink-0" />
            </button>
            <button
              onClick={() => setReaderTheme('sepia')}
              title="Sepia Mode"
              className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-colors cursor-pointer ${
                readerTheme === 'sepia' ? 'bg-amber-700 text-amber-100 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
            </button>
            <button
              onClick={() => setReaderTheme('dark')}
              title="Night Reading"
              className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-colors cursor-pointer ${
                readerTheme === 'dark' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          {/* Action Buttons for Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                title="Download PDF"
                className="h-8 flex items-center gap-1.5 px-3 bg-saffron text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="translate-y-[1px]">Download</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Reader'}
              className="h-8 w-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700/60 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Document Content Container with Custom Dark Scrollbar */}
      <div className="flex-1 w-full bg-slate-950 overflow-y-auto custom-scrollbar relative flex flex-col items-center py-6 px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-saffron" />
            <span className="text-xs font-medium font-hindi-body">पावन ग्रंथ लोड हो रहा है...</span>
          </div>
        ) : error ? (
          <iframe
            key={`${pdfUrl}-page-${pageNumber}`}
            src={`${pdfUrl}#page=${pageNumber}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
            title={title}
            className={`w-full h-full min-h-[650px] border-none outline-none ${getThemeFilterClass()}`}
          />
        ) : (
          <canvas
            ref={canvasRef}
            className={`max-w-full shadow-2xl rounded-lg border border-slate-800/80 transition-all duration-300 ${getThemeFilterClass()}`}
          />
        )}
      </div>
    </div>
  );
};
