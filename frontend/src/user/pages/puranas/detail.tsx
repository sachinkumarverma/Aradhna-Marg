import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, Eye, BookOpen, Sparkles, ArrowLeft, Calendar, ArrowRight } from 'lucide-react';
import { apiClient } from '@api/client';
import { PublicApi } from '@api/publicApi';
import toast from 'react-hot-toast';
import { Breadcrumb } from '@components/common/Breadcrumb';
import { SafeHtmlContent } from '@components/common/SafeHtmlContent';
import { SocialShareButtons } from '@components/common/SocialShareButtons';
import { useTranslation } from '@i18n/LanguageContext';
import { IconText } from '@components/common/IconText';
import { SectionHeader } from '@components/common/SectionHeader';
import { ArticleCard } from '@components/cards/ArticleCard';
import { CustomLoader } from '@components/common/CustomLoader';
import { AdUnit } from '@components/common/AdUnit';
import { SEOHead, buildBreadcrumbSchema, buildBookSchema } from '@components/seo';

export const PuranDetail: React.FC = () => {
  const { language, t, getLocalizedField } = useTranslation();
  const { slug } = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['puran-public', slug, language],
    queryFn: async () => {
      const res = await apiClient.get(`/v1/puranas/${slug}`);
      return res.data.data;
    },
    enabled: !!slug
  });

  const { data: extraContent } = useQuery({
    queryKey: ['purana-detail-extra-content', language],
    queryFn: () => PublicApi.getHomeData()
  });

  const trackViewMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/v1/puranas/${id}/view`)
  });

  const trackDownloadMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/v1/puranas/${id}/download`)
  });

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

  const handleReadPdf = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async () => {
    if (!data?.id) return;
    trackDownloadMutation.mutate(data.id);

    const toastId = toast.loading('PDF डाउनलोड हो रहा है...');
    try {
      const fileName = `${getLocalizedField(data, 'title') || data.title || 'Purana'}.pdf`;

      // 1. Fetch current PDF signed URL from public API
      let targetUrl = pdfUrl || data.pdf_file;
      try {
        const res = await apiClient.get<{ data: { url: string } } | { url: string }>(
          `/v1/public/puranas/${data.id}/pdf?download=true`
        );
        const urlFromApi = (res.data as any)?.data?.url || (res.data as any)?.url;
        if (urlFromApi) {
          targetUrl = urlFromApi;
        }
      } catch (e) {
        console.warn('Using default pdfUrl:', e);
      }

      if (!targetUrl) {
        toast.error('PDF file not available.', { id: toastId });
        return;
      }

      // 2. Build backend proxy download URL (bypasses browser CORS & sets Content-Disposition attachment)
      const proxyDownloadUrl = `${apiClient.defaults.baseURL}/v1/public/proxy-pdf?url=${encodeURIComponent(targetUrl)}&download=true&filename=${encodeURIComponent(fileName)}`;

      // 3. Fetch as blob from same-origin backend proxy to open native Save As file dialog
      try {
        const response = await fetch(proxyDownloadUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
          toast.success(t('common.download'), { id: toastId });
          return;
        }
      } catch (fetchErr) {
        console.warn('Proxy blob fetch failed, falling back to direct link:', fetchErr);
      }

      // 4. Fallback: Trigger direct browser download using backend proxy attachment URL
      const a = document.createElement('a');
      a.href = proxyDownloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success(t('common.download'), { id: toastId });
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download PDF.', { id: toastId });
    }
  };

  if (isLoading) {
    return <CustomLoader fullScreen text={t('common.loading')} />;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F7F3] p-4 font-hindi-body">
        <SEOHead title={language === 'hi' ? 'पुराण उपलब्ध नहीं है' : 'Purana Not Found'} noIndex={true} />
        <BookOpen className="w-16 h-16 text-saffron mb-4" />
        <h2 className="text-2xl font-black text-darkBrown mb-2 font-hindi-heading">{t('empty.noPuranas')}</h2>
        <p className="text-slate-600 mb-6 text-sm">{t('errors.contentNotAvailable')}</p>
        <Link
          to="/puranas"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-saffron text-white rounded-xl font-bold text-sm hover:brightness-90 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> {t('navigation.puranas')}
        </Link>
      </div>
    );
  }

  const title = getLocalizedField(data, 'title') || data.title;
  const descriptionContent =
    getLocalizedField(data, 'description') ||
    getLocalizedField(data, 'short_description') ||
    data.description ||
    data.short_description ||
    '';
  const isHi = language === 'hi';

  const pageTitle = data.seo_title || title;
  const pageDesc =
    data.seo_description ||
    descriptionContent ||
    (isHi
      ? `${title} - पवित्र हिन्दू महापुराण का सम्पूर्ण सार, अध्याय, कथाएं व विवरण पढ़ें एवं पीडीएफ डाउनलोड करें।`
      : `Read sacred text, chapters, divine teachings, and download PDF for ${title} on Aradhna Marg.`);

  const puranSchemas = [
    buildBookSchema({
      name: title,
      description: pageDesc,
      url: `/puranas/${data.slug || slug}`,
      inLanguage: isHi ? 'hi' : 'en'
    }),
    buildBreadcrumbSchema([
      { name: isHi ? 'मुख्य पृष्ठ' : 'Home', item: '/' },
      { name: isHi ? 'पुराण' : 'Puranas', item: '/puranas' },
      { name: title, item: `/puranas/${data.slug || slug}` }
    ])
  ];

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pb-24 pt-0">
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        canonicalPath={`/puranas/${data.slug || slug}`}
        ogImage={data.cover_image || data.image_url}
        schema={puranSchemas}
      />
      {/* Dark Hero Section Header */}
      <div className="bg-gradient-to-br from-[#2C1810] via-[#3D2317] to-[#1F100B] text-cream pt-2 sm:pt-3 md:pt-4 pb-12 sm:pb-16 shadow-xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Top Navigation & Breadcrumbs */}
          <div className="mb-3.5 sm:mb-6">
            <Breadcrumb
              items={[
                { label: isHi ? 'होम' : 'Home', to: '/' },
                { label: isHi ? 'पुराण' : 'Puranas', to: '/puranas' },
                { label: title }
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
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-amber-200/60">
                    <BookOpen className="w-16 h-16 mb-3 text-saffron" />
                    <span className="text-xs font-bold uppercase tracking-wider">Sanatan Text</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Meta Details */}
            <div className="lg:col-span-8 flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3.5 mb-3 sm:mb-6">
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-saffron/20 text-saffron border border-saffron/30 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  {data.language || 'संस्कृत / हिंदी'}
                </span>
                {data.author && (
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white/10 text-amber-100 rounded-full text-[11px] sm:text-xs font-bold truncate max-w-[220px] sm:max-w-none">
                    Author: {data.author}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3 sm:mb-4 mt-1 font-hindi-heading">
                {title}
              </h1>

              {/* View & Download Stats Badges */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-amber-100/80 mb-4 sm:mb-6 py-2 sm:py-3 border-y border-amber-200/10 font-hindi-body">
                <IconText
                  icon={<Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-saffron" />}
                  gap="gap-1.5 sm:gap-2"
                  textClassName="font-semibold"
                  text={`${data.view_count?.toLocaleString() || 0} ${t('common.views')}`}
                />
                <IconText
                  icon={<Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-saffron" />}
                  gap="gap-1.5 sm:gap-2"
                  textClassName="font-semibold"
                  text={`${data.download_count?.toLocaleString() || 0} ${t('common.download')}`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 font-hindi-heading">
                {pdfUrl && (
                  <>
                    <button
                      type="button"
                      onClick={handleReadPdf}
                      className="h-9 sm:h-11 px-4 sm:px-6 inline-flex items-center justify-center gap-1.5 sm:gap-2.5 bg-saffron hover:bg-orange-600 text-white rounded-full font-bold text-xs sm:text-sm hover:brightness-105 transition-all shadow-lg hover:shadow-saffron/20 cursor-pointer active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>{t('common.readPdf')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="h-9 sm:h-11 px-3.5 sm:px-6 inline-flex items-center justify-center gap-1.5 sm:gap-2.5 bg-white/10 hover:bg-white/20 text-amber-100 border border-amber-200/20 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>{t('common.download')}</span>
                    </button>
                  </>
                )}
                <SocialShareButtons title={title} url={window.location.href} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 font-hindi-body">
        {/* Description Card */}
        {descriptionContent && (
          <div className="bg-white rounded-xl p-4 sm:p-8 shadow-xs border border-gray-100 mb-8">
            <div className="pb-3 sm:pb-4 mb-4 sm:mb-6 border-b border-gray-100">
              <IconText
                icon={<BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-saffron" />}
                gap="gap-2 sm:gap-2.5"
                text={
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-darkBrown tracking-tight font-hindi-heading leading-tight">
                    {t('content.puranasSubtitle')}
                  </h2>
                }
              />
            </div>
            <SafeHtmlContent content={descriptionContent} />
          </div>
        )}

        {/* Ad Unit Placeholder */}
        <div className="my-6">
          <AdUnit slot="banner" label="ADVERTISEMENT • विज्ञापन" />
        </div>

        {/* Related Articles Section */}
        {extraContent?.featuredArticles && extraContent.featuredArticles.length > 0 && (
          <div className="mt-12">
            <SectionHeader
              icon={<BookOpen className="w-6 h-6 text-saffron fill-saffron" />}
              title="Related Articles & Insights"
              hindiTitle="संबंधित धार्मिक लेख"
              actionLink={{ to: '/articles', label: 'View All' }}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {extraContent.featuredArticles.slice(0, 3).map((article: any) => (
                <ArticleCard
                  key={article.id}
                  id={article.id}
                  slug={article.slug}
                  title={getLocalizedField(article, 'title')}
                  featuredImageUrl={article.featured_image_url}
                  excerpt={getLocalizedField(article, 'excerpt')}
                  categoryName={getLocalizedField(article, 'category_name') || article.category_name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Major Festivals & Vrats Section */}
        {extraContent?.festivals && extraContent.festivals.length > 0 && (
          <div className="mt-12">
            <SectionHeader
              icon={<Calendar className="w-6 h-6 text-saffron fill-saffron/20" />}
              title="Major Festivals & Vrats"
              hindiTitle="प्रमुख व्रत व त्योहार"
              actionLink={{ to: '/festivals', label: 'View All' }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {extraContent.festivals.slice(0, 3).map((fest: any) => {
                const festName = fest.displayName || getLocalizedField(fest, 'name');
                const festDesc = fest.displayDescription || getLocalizedField(fest, 'short_description');
                return (
                  <Link
                    key={fest.id}
                    to={`/festivals/${fest.slug || fest.id}`}
                    className="group block bg-white rounded-xl p-3.5 sm:p-4 border border-orange-100/80 shadow-2xs hover:shadow-md hover:border-saffron/40 transition-all flex items-center gap-3.5 cursor-pointer"
                  >
                    {fest.banner_image ? (
                      <div className="aspect-video w-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <img
                          src={fest.banner_image}
                          alt={festName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-orange-100 flex items-center justify-center text-saffron shrink-0 group-hover:scale-105 transition-transform">
                        <Calendar className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                      <div>
                        <h3 className="font-bold text-base text-darkBrown line-clamp-1 group-hover:text-saffron transition-colors font-hindi-heading">
                          {festName}
                        </h3>
                        {festDesc && (
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed font-hindi-body">
                            {festDesc}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-end mt-1.5">
                        <span className="inline-flex items-center text-xs font-bold text-saffron group-hover:underline font-hindi-heading">
                          {t('common.read')}{' '}
                          <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
