import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CollectionHero } from '@components/layout/CollectionHero';
import { BhajanCard } from '@components/cards/BhajanCard';
import { PublicApi } from '@api/publicApi';
import { Loader2, Music, BookOpen } from 'lucide-react';
import { SafeHtmlContent } from '@components/common/SafeHtmlContent';
import { useTranslation } from '../../i18n/LanguageContext';

export const CollectionDetails: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const { t, getLocalizedField } = useTranslation();

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
            title: getLocalizedField(deity, 'name') || 'Deity',
            description: getLocalizedField(deity, 'short_description') || 'पावन देवी-देवता के समस्त भजन एवं लेख संग्रह',
            image: deity?.image,
            bhajans: res.relatedBhajans || [],
            articles: res.relatedArticles || []
          });
        } else if (collectionType === 'categories') {
          const res = await PublicApi.getCategoryBySlug(id);
          const cat = res.category;
          setData({
            title: getLocalizedField(cat, 'name') || 'Category',
            description: getLocalizedField(cat, 'description') || 'श्रेणी से संबंधित पावन सामग्री',
            image: cat?.image_url || cat?.icon_url,
            bhajans: res.bhajans || [],
            articles: res.articles || []
          });
        } else {
          const res = await PublicApi.getFestivalBySlug(id);
          setData({
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
  }, [id, collectionType, getLocalizedField]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F9F7F3] pt-24">
        <Loader2 className="w-10 h-10 animate-spin text-saffron" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#F9F7F3] pt-24 text-center px-4">
        <h2 className="text-3xl font-black text-darkBrown mb-4">{t('errors.contentNotAvailable')}</h2>
        <Link to="/" className="px-6 py-3 bg-saffron text-white rounded-full font-bold shadow-md hover:brightness-90">
          {t('errors.returnHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pb-24">
      <CollectionHero
        title={data.title}
        description={data.description}
        breadcrumbs={[
          { label: t('breadcrumbs.explore'), path: '/explore' },
          { label: data.title, path: '#' }
        ]}
        stats={[
          { label: t('navigation.bhajans'), value: `${data.bhajans?.length || 0}` },
          { label: t('navigation.articles'), value: `${data.articles?.length || 0}` }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Rich Description if available */}
        {data.content && (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <SafeHtmlContent content={data.content} />
          </div>
        )}

        {/* Associated Bhajans Section */}
        {data.bhajans && data.bhajans.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-darkBrown mb-8 flex items-center gap-3 font-hindi-heading leading-snug">
              <div className="shrink-0 flex items-center justify-center">
                <Music className="w-7 h-7 text-saffron" />
              </div>
              <span>
                {t('content.relatedBhajans')} ({data.bhajans.length})
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.bhajans.map((bhajan: any) => (
                <Link key={bhajan.id} to={`/bhajans/${bhajan.slug || bhajan.id}`}>
                  <BhajanCard
                    title={bhajan.title}
                    godName={data.title}
                    views={bhajan.views || 0}
                    duration={bhajan.duration ? `${Math.floor(bhajan.duration / 60)} m` : t('navigation.bhajans')}
                    thumbnailUrl={bhajan.thumbnail_url}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Associated Articles Section */}
        {data.articles && data.articles.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-darkBrown mb-8 flex items-center gap-3 font-hindi-heading leading-snug">
              <div className="shrink-0 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-saffron" />
              </div>
              <span>
                {t('content.relatedArticles')} ({data.articles.length})
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {data.articles.map((art: any) => {
                const title = art.displayTitle || getLocalizedField(art, 'title');
                const excerpt = art.displayExcerpt || getLocalizedField(art, 'excerpt');
                return (
                  <Link
                    key={art.id}
                    to={`/articles/${art.slug || art.id}`}
                    className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-saffron/30 shadow-sm hover:shadow-md transition-all flex flex-col p-5"
                  >
                    {art.featured_image_url && (
                      <img
                        src={art.featured_image_url}
                        alt={title}
                        className="w-full h-44 object-cover rounded-2xl mb-4"
                      />
                    )}
                    <h3 className="font-bold text-lg text-darkBrown line-clamp-2 hover:text-saffron transition-colors">
                      {title}
                    </h3>
                    {excerpt && <p className="text-slate-600 text-xs line-clamp-2 mt-2 leading-relaxed">{excerpt}</p>}
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
