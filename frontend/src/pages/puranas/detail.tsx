import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, Eye, BookOpen, FileText, Sparkles, ArrowLeft, Share2 } from 'lucide-react';
import { apiClient } from '@api/client';
import toast from 'react-hot-toast';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { SafeHtmlContent } from '@components/common/SafeHtmlContent';
import { DedicatedPdfViewer } from '@components/pdf/DedicatedPdfViewer';
import { SocialShareButtons } from '@components/common/SocialShareButtons';

export const PuranDetail: React.FC = () => {
  const { slug } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['puran-public', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/v1/puranas/${slug}`);
      return res.data.data;
    },
    enabled: !!slug
  });

  const trackViewMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/v1/puranas/${id}/view`)
  });

  const trackDownloadMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/v1/puranas/${id}/download`)
  });

  // Track view once loaded & resolve PDF url
  useEffect(() => {
    if (data?.id) {
      trackViewMutation.mutate(data.id);
    }
    if (data?.pdf_file) {
      if (data.pdf_file.startsWith('http')) {
        setPdfUrl(data.pdf_file);
      } else {
        apiClient
          .get(`/v1/puranas/${data.id}/pdf`)
          .then((res) => {
            setPdfUrl(res.data.data?.url || data.pdf_file);
          })
          .catch(() => {
            setPdfUrl(data.pdf_file);
          });
      }
    }
  }, [data?.id, data?.pdf_file]);

  const handleDownload = async () => {
    if (!data?.id) return;
    trackDownloadMutation.mutate(data.id);

    try {
      const finalUrl = pdfUrl || data.pdf_file;
      if (finalUrl) {
        const a = document.createElement('a');
        a.href = finalUrl;
        a.target = '_blank';
        a.download = `${data.title || 'Purana'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Starting PDF download...');
      }
    } catch {
      toast.error('Failed to download PDF.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F3]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 text-sm font-bold">पावन पुराण लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F7F3] p-4">
        <BookOpen className="w-16 h-16 text-saffron mb-4" />
        <h2 className="text-2xl font-black text-darkBrown mb-2">पुराण उपलब्ध नहीं है</h2>
        <p className="text-slate-600 mb-6 text-sm">माफ़ कीजिये, माँगा गया ग्रंथ नहीं मिल सका।</p>
        <Link
          to="/puranas"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-saffron text-white rounded-xl font-bold text-sm hover:brightness-90 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> सभी पुराण देखें
        </Link>
      </div>
    );
  }

  const descriptionContent = data.description || data.short_description || '';

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pb-24 pt-20">
      {/* Dark Hero Section Header */}
      <div className="bg-gradient-to-br from-[#2C1810] via-[#3D2317] to-[#1F100B] text-cream pt-8 pb-16 shadow-xl relative overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dotPatternPurana" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotPatternPurana)" />
          </svg>
        </div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-saffron/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Top Navigation & Breadcrumbs */}
          <div className="mb-8">
            <Breadcrumb
              items={[
                { label: 'मुख्य पृष्ठ', to: '/' },
                { label: 'अष्टादश पुराण', to: '/puranas' },
                { label: data.title }
              ]}
              variant="dark"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Cover Image */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="w-56 sm:w-64 lg:w-72 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-200/20 bg-gradient-to-br from-amber-900/40 to-black relative group">
                {data.cover_image ? (
                  <img
                    src={data.cover_image}
                    alt={data.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-amber-200/60">
                    <BookOpen className="w-16 h-16 mb-3 text-saffron" />
                    <span className="text-xs font-bold uppercase tracking-wider">सनातन पुराण</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Meta Details */}
            <div className="lg:col-span-8 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-saffron/20 text-saffron border border-saffron/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {data.language || 'संस्कृत / हिंदी'}
                </span>
                {data.author && (
                  <span className="px-3 py-1 bg-white/10 text-amber-100 rounded-full text-xs font-bold">
                    रचयिता: {data.author}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4 font-serif">
                {data.title}
              </h1>

              {/* View & Download Stats Badges */}
              <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-amber-100/80 mb-6 py-3 border-y border-amber-200/10">
                <div className="flex items-center gap-2 font-semibold">
                  <Eye className="w-4 h-4 text-saffron" />
                  <span>{data.view_count?.toLocaleString() || 0} पाठ (Views)</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <Download className="w-4 h-4 text-saffron" />
                  <span>{data.download_count?.toLocaleString() || 0} डाउनलोड (Downloads)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                {pdfUrl && (
                  <>
                    <button
                      onClick={() => {
                        setShowPdfViewer(true);
                        document.getElementById('pdf-viewer-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center gap-2.5 px-6 py-3 bg-saffron text-white rounded-2xl font-bold text-sm hover:brightness-110 transition-all shadow-lg hover:shadow-saffron/20"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>ऑनलाइन पढ़ें (Read Online)</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2.5 px-6 py-3 bg-white/10 text-amber-100 border border-amber-200/20 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>डाउनलोड करें (Download)</span>
                    </button>
                  </>
                )}
                <SocialShareButtons title={data.title} url={window.location.href} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        {/* Description Card */}
        {descriptionContent && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100 mb-10">
            <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-100">
              <BookOpen className="w-6 h-6 text-saffron" />
              <h2 className="text-2xl font-black text-darkBrown tracking-tight">पुराण परिचय एवं महिमा</h2>
            </div>
            {/* Rendered safely via SafeHtmlContent component */}
            <SafeHtmlContent content={descriptionContent} />
          </div>
        )}

        {/* Dedicated PDF Viewer Section */}
        <div id="pdf-viewer-section">
          {pdfUrl ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-12">
              <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-saffron" />
                  <h2 className="text-2xl font-black text-darkBrown tracking-tight">डिजिटल पाठ संस्करण</h2>
                </div>
                {showPdfViewer && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowPdfViewer(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all shadow-xs"
                    >
                      <BookOpen className="w-4 h-4" />
                      पाठ बंद करें (Close Reader)
                    </button>
                  </div>
                )}
              </div>

              {showPdfViewer ? (
                <DedicatedPdfViewer pdfUrl={pdfUrl} title={data.title} onDownload={handleDownload} />
              ) : (
                <div className="bg-amber-50/50 rounded-2xl p-6 sm:p-8 border border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-saffron/10 text-saffron flex items-center justify-center shrink-0">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-darkBrown mb-1">ऑनलाइन पठन व्यूअर</h3>
                      <p className="text-slate-600 text-xs sm:text-sm font-medium">
                        पृष्ठ संख्या चयन, ज़ूम तथा रात्रि पठन मोड की सुविधा उपलब्ध है।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setShowPdfViewer(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-saffron text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-md"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>पाठ प्रारंभ करें (Open Reader)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100 mb-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-darkBrown mb-1">PDF संचिका उपलब्ध नहीं है</h3>
              <p className="text-slate-500 text-xs">इस ग्रंथ की डिजिटल PDF फाइल जल्द ही अपलोड की जाएगी।</p>
            </div>
          )}
        </div>

        {/* Related Puranas Section */}
        {data.related && data.related.length > 0 && (
          <div className="mt-14">
            <h3 className="text-2xl font-black text-darkBrown mb-6 tracking-tight flex items-center gap-2 font-serif">
              <BookOpen className="w-6 h-6 text-saffron" /> अन्य पावन अष्टादश पुराण
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.related.map((puran: any) => (
                <Link
                  to={`/puranas/${puran.slug || puran.id}`}
                  key={puran.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-saffron/40 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center border border-amber-200/40">
                      {puran.cover_image ? (
                        <img
                          src={puran.cover_image}
                          alt={puran.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <BookOpen className="w-12 h-12 text-saffron" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-saffron uppercase tracking-wider mb-1 block">
                      {puran.language || 'संस्कृत/हिंदी'}
                    </span>
                    <h4 className="font-extrabold text-darkBrown line-clamp-1 group-hover:text-saffron transition-colors">
                      {puran.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
