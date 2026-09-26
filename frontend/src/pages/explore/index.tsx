import React, { useEffect, useState } from 'react';
import { CollectionHero } from '@components/layout/CollectionHero';
import { CollectionCarousel } from '@components/carousels/CollectionCarousel';
import { PublicApi } from '@api/publicApi';
import { BhajanCard } from '@components/cards/BhajanCard';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const ExplorePage: React.FC = () => {
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
            name: d.name,
            count: 0,
            thumbnail: d.image || '/Deities/Krishna.png'
          }))
        );

        setCategories(
          (cats || []).map((c: any) => ({
            id: c.slug || c.id,
            name: c.name,
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
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pb-20">
      <CollectionHero
        title="पावन भजन एवं ग्रंथ खोजें"
        description="सनातन धर्म के विभिन्न सम्प्रदायों, देवी-देवताओं तथा उत्सवों के अनुसार विभाजित भजन एवं साहित्य।"
        breadcrumbs={[{ label: 'खोजें (Explore)', path: '/explore' }]}
      />

      <div className="mt-8 space-y-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-saffron" />
          </div>
        ) : (
          <>
            {/* Popular Deities Collection */}
            {deities.length > 0 && <CollectionCarousel title="पावन देवी-देवता" items={deities} type="god" />}

            {/* Popular Categories Collection */}
            {categories.length > 0 && <CollectionCarousel title="भजन श्रेणियाँ" items={categories} type="category" />}

            {/* Trending Bhajans Section */}
            {bhajans.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-extrabold text-darkBrown mb-8">लोकप्रिय भजन</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {bhajans.map((bhajan) => (
                    <Link key={bhajan.id} to={`/bhajans/${bhajan.slug || bhajan.id}`}>
                      <BhajanCard
                        title={bhajan.title}
                        godName={bhajan.god_name || bhajan.category_name || 'भजन'}
                        views={bhajan.views || 0}
                        duration={bhajan.duration ? `${Math.floor(bhajan.duration / 60)} मि` : 'भजन'}
                        thumbnailUrl={bhajan.thumbnail_url}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
