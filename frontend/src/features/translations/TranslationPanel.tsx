import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { TranslationApi } from './TranslationApi';
import { toast } from 'react-hot-toast';
import { Languages, RefreshCw, Check, AlertTriangle, Loader2 } from 'lucide-react';

interface TranslationPanelProps {
  contentType: 'ARTICLE' | 'PURAN' | 'FESTIVAL';
  contentId: string;
  sourceLang: string;
  targetLang: string;
  hasTranslation: boolean;
  isOutdated?: boolean;
  onGenerateLive: (translations: any) => void;
  originalContent: Record<string, any>;
}

export const TranslationPanel: React.FC<TranslationPanelProps> = ({ 
  hasTranslation,
  isOutdated,
  onGenerateLive,
  originalContent,
  sourceLang,
  targetLang
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      return await TranslationApi.generateLive({
        content: originalContent,
        sourceLang,
        targetLang
      });
    },
    onSuccess: (data) => {
      toast.success('Translation generated successfully!');
      onGenerateLive(data.translations);
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate translation');
      setIsGenerating(false);
    }
  });

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 mb-6">
      <div className="flex items-center gap-4 mb-3 sm:mb-0">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <Languages className="w-4 h-4 text-indigo-600" />
          Translation: {sourceLang === 'hi' ? 'Hindi' : 'English'} → {targetLang === 'en' ? 'English' : 'Hindi'}
        </div>
        
        {hasTranslation ? (
          isOutdated ? (
            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Outdated
            </span>
          ) : (
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
              <Check className="w-3 h-3" /> Generated
            </span>
          )
        ) : (
          <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
            Not Generated
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          if (hasTranslation) {
            if (!window.confirm("Regenerate English Translation?\n\nThis will replace the current English translation. Any manual changes made to the English version will be lost.")) return;
          }
          generateMutation.mutate();
        }}
        disabled={isGenerating}
        className="flex justify-center items-center gap-2 bg-white border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-md text-sm font-bold hover:bg-indigo-50 hover:border-indigo-300 transition shadow-sm disabled:opacity-50"
      >
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {hasTranslation ? 'Regenerate Translation' : 'Generate English Translation'}
      </button>
    </div>
  );
};
