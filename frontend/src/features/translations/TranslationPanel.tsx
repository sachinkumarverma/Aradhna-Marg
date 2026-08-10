import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { TranslationApi } from './TranslationApi';
import { toast } from 'react-hot-toast';
import { Sparkles, RefreshCw, Check, Loader2, Edit3 } from 'lucide-react';

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

  const handleGenerate = () => {
    if (hasTranslation) {
      if (!window.confirm("Regenerate English Translation?\n\nThis will replace the current English translation. Any manual changes made to the English version will be lost.")) return;
    }
    generateMutation.mutate();
  };

  if (!hasTranslation) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-8 bg-[#FAFAFE] border border-[#F0F0F8] rounded-xl p-4 sm:px-5 sm:py-3.5 mb-6 w-fit shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-indigo-200 border-dashed flex items-center justify-center bg-white shrink-0">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="font-bold text-[#1a1a2e] text-sm">Translation not generated</div>
            <div className="text-[13px] text-gray-500 mt-0.5 leading-tight">Generate English translation from the Hindi content.</div>
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2.5 bg-[#5542F6] hover:bg-[#4a39d4] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span className="text-left leading-tight text-[13px]">
            Generate<br/>Translation
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 bg-[#F3FAF5] border border-[#E7F3EB] rounded-xl p-4 sm:px-5 sm:py-3.5 mb-6 w-fit shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#DDF2E4] flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-[#2E9E5B]" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-bold text-[#1a1a2e] text-sm">English translation available</div>
          <div className="text-[13px] text-gray-500 mt-0.5 leading-tight">Translation is ready for review and publishing.</div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 bg-white border border-indigo-200 text-[#5542F6] hover:bg-indigo-50 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-[#5542F6]" />}
          Regenerate
        </button>
        
        <button
          type="button"
          onClick={() => {
            // Just simulate edit action by focusing the main title input if it exists
            const firstInput = document.querySelector('input[name="title_en"], input[name="name_en"]') as HTMLInputElement;
            if (firstInput) {
              firstInput.focus();
              window.scrollTo({ top: firstInput.offsetTop - 100, behavior: 'smooth' });
            }
          }}
          className="flex items-center justify-center gap-2 bg-[#E7F3EB] text-[#2E9E5B] hover:bg-[#d5ecd9] px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit Translation
        </button>
      </div>
    </div>
  );
};
