import React, { useEffect, useState } from 'react';
import { CollectionHero } from '@components/layout/CollectionHero';
import { CollectionCarousel } from '@components/carousels/CollectionCarousel';
import { PublicApi } from '@api/publicApi';
import { BhajanCard } from '@components/cards/BhajanCard';
import { Link } from 'react-router-dom';
import { Loader2, Flame } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

import { IconText } from '@components/common/IconText';

export const ExplorePage: React.FC = () => {
  const { t, getLocalizedField } = useTranslation();
  const [deities, setDeities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [bhajans, setBhajans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        setLoading(true);
        const [deits, cats, bhajsRes] = await Promise.all([
          PublicApi.getDeities(),
          PublicApi.getCategories(),
          PublicApi.getBhajans({ limit: 8, sort: 'popular' })
        ]);

        setDeities(
          (deits || []).map((d: any) => ({
            id: d.slug || d.id,
            name: getLocalizedField(d, 'name'),
            count: 0,
            thumbnail: d.image || '/Deities/Krishna.png'
          }))
        );

        setCategories(
          (cats || []).map((c: any) => ({
            id: c.slug || c.id,
            name: getLocalizedField(c, 'name'),
            count: 0,
            thumbnail: c.image_url || c.icon_url
          }))
        );

        setBhajans(bhajsRes.data || []);
      } catch (err) {
        console.error('Failed to load explore data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExploreData();
  }, [getLocalizedField]);

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pb-24">
      <CollectionHero
        title={t('navigation.explore')}
        description={t('content.exploreSubtitle')}
        breadcrumbs={[{ label: t('breadcrumbs.explore'), path: '/explore' }]}
      />

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-saffron shrink-0" />
          </div>
        ) : (
          <>
            {/* Popular Deities Collection */}
            {deities.length > 0 && (
              <CollectionCarousel title={t('content.popularDeities')} items={deities} type="god" />
            )}

            {/* Popular Categories Collection */}
            {categories.length > 0 && (
              <CollectionCarousel title={t('content.bhajanCategories')} items={categories} type="category" />
            )}

            {/* Trending Bhajans Section */}
            {bhajans.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200/60 mb-4">
                  <IconText
                    icon={<Flame className="w-5 h-5 text-saffron fill-saffron" />}
                    gap="gap-2.5"
                    text={
                      <h2 className="text-xl sm:text-2xl font-bold text-darkBrown font-hindi-heading leading-tight">
                        {t('content.trendingBhajans')}
                      </h2>
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {bhajans.map((bhajan) => (
                    <Link key={bhajan.id} to={`/bhajans/${bhajan.slug || bhajan.id}`}>
                      <BhajanCard
                        id={bhajan.id}
                        slug={bhajan.slug}
                        title={bhajan.title}
                        godName={bhajan.god_name || bhajan.category_name || t('navigation.bhajans')}
                        views={bhajan.views || 0}
                        duration={bhajan.duration ? `${Math.floor(bhajan.duration / 60)} m` : t('navigation.bhajans')}
                        thumbnailUrl={bhajan.thumbnail_url}
                      />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
