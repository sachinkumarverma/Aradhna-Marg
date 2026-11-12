import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CollectionHero } from '@components/layout/CollectionHero';
import { BhajanCard } from '@components/cards/BhajanCard';
import { PublicApi } from '@api/publicApi';
import { Loader2, Music, BookOpen, Calendar } from 'lucide-react';
import { SafeHtmlContent } from '@components/common/SafeHtmlContent';
import { useTranslation } from '@i18n/LanguageContext';
import { CustomLoader } from '@components/common/CustomLoader';
import { CollectionDetailSkeleton } from '@components/common/SkeletonLoader';
import { AdUnit } from '@components/common/AdUnit';
import { SEOHead, buildBreadcrumbSchema } from '@components/seo';

export const CollectionDetails: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const { language, t, getLocalizedField } = useTranslation();

  // Determine type based on URL path ('categories' vs 'gods' vs 'festivals')
  const collectionType = location.pathname.split('/')[1];

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        if (collectionType === 'gods' || collectionType === 'deities') {
          const res = await PublicApi.getDeityBySlug(id);
          const deity = res.deity;
          setData({
            slug: deity?.slug,
            title: getLocalizedField(deity, 'name') || (language === 'hi' ? 'देवी-देवता' : 'Deity'),
            description:
              getLocalizedField(deity, 'short_description') ||
              (language === 'hi'
                ? 'पावन देवी-देवता के समस्त भजन, लेख एवं त्योहार संग्रह'
                : 'Devotional bhajans, articles, and festivals for this deity'),
            image: deity?.image,
            bhajans: res.relatedBhajans || [],
            articles: res.relatedArticles || [],
            festivals: res.relatedFestivals || []
          });
        } else if (collectionType === 'categories') {
          const res = await PublicApi.getCategoryBySlug(id);
          const cat = res.category;
          setData({
            slug: cat?.slug,
            title: getLocalizedField(cat, 'name') || (language === 'hi' ? 'श्रेणी' : 'Category'),
            description:
              getLocalizedField(cat, 'description') ||
              (language === 'hi' ? 'श्रेणी से संबंधित पावन सामग्री' : 'Devotional content for this category'),
            image: cat?.image_url || cat?.icon_url,
            bhajans: res.bhajans || [],
            articles: res.articles || []
          });
        } else {
          const res = await PublicApi.getFestivalBySlug(id);
          setData({
            slug: res.slug,
            title: res.displayName || getLocalizedField(res, 'name') || 'Festival',
            description:
              res.displayDescription ||
              getLocalizedField(res, 'short_description') ||
              getLocalizedField(res, 'description'),
            image: res.banner_image,
            content: res.displayContent || getLocalizedField(res, 'content'),
            bhajans: res.related_bhajans || [],
            articles: res.related_articles || []
          });
        }
      } catch (err) {
        console.error('Failed to load collection details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, collectionType, language, getLocalizedField]);

  const targetCollection = collectionType === 'deities' ? 'gods' : collectionType;

  // If user navigated via legacy UUID or alternate route, seamlessly update address bar to clean canonical slug
  useEffect(() => {
    if (data?.slug && (id !== data.slug || collectionType === 'deities')) {
      window.history.replaceState(null, '', `/${targetCollection}/${data.slug}`);
    }
  }, [data?.slug, id, collectionType, targetCollection]);

  if (loading) {
    return <CollectionDetailSkeleton />;
  }

  if (!data) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#F9F7F3] pt-24 text-center px-4">
        <SEOHead title="Collection Not Found" noIndex={true} />
        <h2 className="text-3xl font-black text-darkBrown mb-4">{t('errors.contentNotAvailable')}</h2>
        <Link to="/" className="px-6 py-3 bg-saffron text-white rounded-full font-bold shadow-md hover:brightness-90">
          {t('errors.returnHome')}
        </Link>
      </div>
    );
  }

  const isHi = language === 'hi';
  const pageTitle = data.title;
  const pageDesc =
    data.description ||
    (isHi
      ? `${data.title} से संबंधित समस्त पावन भजन, आरती, चालीसा, धार्मिक लेख एवं कथाएं।`
      : `Explore devotional songs, bhajans, aarti, and spiritual articles for ${data.title} on Aradhna Marg.`);

  const canonicalSlug = data.slug || id;
  const canonicalPath = `/${targetCollection}/${canonicalSlug}`;

  const breadcrumbSectionLabel =
    targetCollection === 'gods' ? (isHi ? 'देवी-देवता' : 'Deities') : isHi ? 'श्रेणियां' : 'Categories';

  const breadcrumbs = buildBreadcrumbSchema([
    { name: isHi ? 'मुख्य पृष्ठ' : 'Home', item: '/' },
    { name: breadcrumbSectionLabel, item: `/${targetCollection}` },
    { name: data.title, item: canonicalPath }
  ]);

  return (
    <div className="w-full flex-1 bg-[#F9F7F3] pb-6 sm:pb-10">
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        canonicalPath={canonicalPath}
        ogImage={data.image}
        schema={breadcrumbs}
      />
      <CollectionHero
        title={data.title}
        description={data.description}
        breadcrumbs={[
          {
            label:
              collectionType === 'gods' || collectionType === 'deities'
                ? t('breadcrumbs.gods')
                : collectionType === 'categories'
                  ? t('breadcrumbs.categories')
                  : t('breadcrumbs.explore'),
            path:
              collectionType === 'gods' || collectionType === 'deities'
                ? `/${collectionType}`
                : collectionType === 'categories'
                  ? '/categories'
                  : '/explore'
          },
          { label: data.title, path: '#' }
        ]}
        stats={[
          { label: t('navigation.bhajans'), value: `${data.bhajans?.length || 0}` },
          { label: t('navigation.articles'), value: `${data.articles?.length || 0}` },
          { label: t('navigation.festivals'), value: `${data.festivals?.length || 0}` }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-10 space-y-6 sm:space-y-10 md:space-y-12">
        {/* Rich Description if available */}
        {data.content && (
          <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
            <SafeHtmlContent content={data.content} />
          </div>
        )}

        {/* Associated Bhajans Section */}
        {data.bhajans && data.bhajans.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-darkBrown mb-4 sm:mb-6 flex items-center gap-2.5 font-hindi-heading leading-snug">
              <div className="shrink-0 flex items-center justify-center">
                <Music className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-saffron" />
              </div>
              <span>
                {t('content.relatedBhajans')} ({data.bhajans.length})
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {data.bhajans.map((bhajan: any) => {
                const enTitle = bhajan.english_title || bhajan.title_en;
                const localizedTitle =
                  getLocalizedField(bhajan, 'title') || (language === 'en' && enTitle ? enTitle : bhajan.title);
                const godDisplayName =
                  collectionType === 'gods' || collectionType === 'deities'
                    ? data.title
                    : getLocalizedField(bhajan, 'god_name') || bhajan.god_name;
                return (
                  <BhajanCard
                    key={bhajan.id}
                    id={bhajan.id}
                    slug={bhajan.slug || bhajan.id}
                    title={localizedTitle}
                    englishTitle={enTitle}
                    godName={godDisplayName}
                    views={bhajan.views || 0}
                    duration={
                      bhajan.duration
                        ? `${Math.floor(bhajan.duration / 60)}: ${(bhajan.duration % 60).toString().padStart(2, '0')}`
                        : undefined
                    }
                    thumbnailUrl={bhajan.thumbnail_url}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Associated Articles Section */}
        {data.articles && data.articles.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-darkBrown mb-4 sm:mb-6 flex items-center gap-2.5 font-hindi-heading leading-snug">
              <div className="shrink-0 flex items-center justify-center">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-saffron" />
              </div>
              <span>
                {t('content.relatedArticles')} ({data.articles.length})
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              {data.articles.map((art: any) => {
                const title = getLocalizedField(art, 'title') || art.displayTitle || art.title;
                const excerpt = getLocalizedField(art, 'excerpt') || art.displayExcerpt || art.excerpt;
                return (
                  <Link
                    key={art.id}
                    to={`/articles/${art.slug || art.id}`}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-saffron/30 shadow-sm hover:shadow-md transition-all flex flex-col p-4 sm:p-5 group"
                  >
                    {art.featured_image_url && (
                      <div className="w-full h-44 rounded-xl overflow-hidden mb-3.5 bg-gray-100 shrink-0">
                        <img
                          src={art.featured_image_url}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <h3 className="font-bold text-base sm:text-lg text-darkBrown line-clamp-2 group-hover:text-saffron transition-colors font-hindi-heading">
                      {title}
                    </h3>
                    {excerpt && (
                      <p className="text-slate-600 text-xs line-clamp-2 mt-1.5 leading-relaxed font-hindi-body">
                        {excerpt}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Associated Festivals Section */}
        {data.festivals && data.festivals.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-darkBrown mb-4 sm:mb-6 flex items-center gap-2.5 font-hindi-heading leading-snug">
              <div className="shrink-0 flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-saffron" />
              </div>
              <span>
                {t('navigation.festivals')} ({data.festivals.length})
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              {data.festivals.map((fest: any) => {
                const festName = getLocalizedField(fest, 'name') || fest.displayName || fest.name;
                const festDesc =
                  getLocalizedField(fest, 'short_description') || fest.displayDescription || fest.short_description;
                return (
                  <Link
                    key={fest.id}
                    to={`/festivals/${fest.slug || fest.id}`}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-saffron/30 shadow-sm hover:shadow-md transition-all flex flex-col p-4 sm:p-5 group"
                  >
                    {fest.banner_image && (
                      <div className="w-full h-44 rounded-xl overflow-hidden mb-3.5 bg-gray-100 shrink-0">
                        <img
                          src={fest.banner_image}
                          alt={festName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <h3 className="font-bold text-base sm:text-lg text-darkBrown line-clamp-2 group-hover:text-saffron transition-colors font-hindi-heading">
                      {festName}
                    </h3>
                    {festDesc && (
                      <p className="text-slate-600 text-xs line-clamp-2 mt-1.5 leading-relaxed font-hindi-body">
                        {festDesc}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Ad Unit (served strictly on collections with active content) */}
        {((data.bhajans?.length || 0) > 0 || (data.articles?.length || 0) > 0 || (data.festivals?.length || 0) > 0) && (
          <div className="pt-0">
            <AdUnit slot="banner" label="ADVERTISEMENT • विज्ञापन" />
          </div>
        )}
      </div>
    </div>
  );
};
