import React from 'react';
import { BookOpen, Music, Scroll } from 'lucide-react';
import { motion } from 'framer-motion';
import { PuranaCard } from '@components/cards/PuranaCard';
import { ArticleCard } from '@components/cards/ArticleCard';
import { BhajanCard } from '@components/cards/BhajanCard';
import { SectionHeader } from '@components/common/SectionHeader';
import { useTranslation } from '@i18n/LanguageContext';

interface BottomRelatedContentProps {
  relatedArticles?: any[];
  relatedPuranas?: any[];
  relatedBhajans?: any[];
}

export const BottomRelatedContent: React.FC<BottomRelatedContentProps> = ({
  relatedArticles = [],
  relatedPuranas = [],
  relatedBhajans = []
}) => {
  const { getLocalizedField } = useTranslation();
  const hasPuranas = relatedPuranas && relatedPuranas.length > 0;
  const hasArticles = relatedArticles && relatedArticles.length > 0;
  const hasBhajans = relatedBhajans && relatedBhajans.length > 0;

  if (!hasPuranas && !hasArticles && !hasBhajans) return null;

  return (
    <div className="flex flex-col gap-5 w-full mt-4">
      {/* 1. Sacred Scriptures & PDFs (Puranas / Granths) Section */}
      {hasPuranas && (
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl p-3.5 sm:p-5 border border-amber-100 shadow-xs"
        >
          <SectionHeader
            icon={<Scroll className="w-5 h-5 text-saffron" />}
            title="Sacred Scriptures & Puranas"
            hindiTitle="पुराण एवं ग्रन्थ"
            actionLink={{ to: '/puranas', label: 'View All Scriptures' }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedPuranas.map((puran) => (
              <PuranaCard
                key={puran.id}
                id={puran.id}
                slug={puran.slug}
                title={getLocalizedField(puran, 'title')}
                coverImage={puran.cover_image}
                shortDescription={getLocalizedField(puran, 'short_description')}
                viewCount={puran.view_count || puran.views}
                language={puran.language}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* 2. Related Articles Section */}
      {hasArticles && (
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl p-3.5 sm:p-5 border border-amber-100 shadow-xs"
        >
          <SectionHeader
            icon={<BookOpen className="w-5 h-5 text-saffron" />}
            title="Related Articles & Insights"
            hindiTitle="धार्मिक लेख"
            actionLink={{ to: '/articles', label: 'Explore All' }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                id={article.id}
                slug={article.slug}
                title={getLocalizedField(article, 'title') || article.displayTitle || article.title}
                featuredImageUrl={article.featured_image_url}
                excerpt={getLocalizedField(article, 'excerpt') || article.displayExcerpt || article.excerpt}
                categoryName={getLocalizedField(article, 'category_name') || article.category_name}
                layout="horizontal"
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* 3. Recommended Bhajans / Devotional Videos Grid */}
      {hasBhajans && (
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl p-3.5 sm:p-5 border border-orange-100 shadow-xs"
        >
          <SectionHeader
            icon={<Music className="w-5 h-5 text-saffron" />}
            title="Recommended Bhajans & Videos"
            hindiTitle="संबंधित भजन"
            actionLink={{ to: '/bhajans', label: 'View All Bhajans' }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedBhajans.map((bhajan) => (
              <BhajanCard
                key={bhajan.id}
                id={bhajan.id}
                slug={bhajan.slug}
                title={bhajan.title}
                godName={getLocalizedField(bhajan, 'god_name') || bhajan.god_name || bhajan.category_name}
                duration={bhajan.duration}
                thumbnailUrl={bhajan.thumbnail_url}
                views={bhajan.views}
              />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
};
