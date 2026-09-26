import React from 'react';
import { Link } from 'react-router-dom';
import { Music, BookOpen, Calendar, Sparkles, ChevronRight, Eye } from 'lucide-react';

interface RelatedContentProps {
  relatedBhajans?: any[];
  relatedArticles?: any[];
  relatedFestivals?: any[];
  deity?: any;
}

export const RelatedContentSection: React.FC<RelatedContentProps> = ({
  relatedBhajans = [],
  relatedArticles = [],
  relatedFestivals = [],
  deity
}) => {
  const hasContent = relatedBhajans.length > 0 || relatedArticles.length > 0 || relatedFestivals.length > 0 || !!deity;

  if (!hasContent) return null;

  return (
    <aside className="w-full flex flex-col gap-6 min-w-0 overflow-hidden">
      {/* Explore Deity Card */}
      {deity && (
        <Link
          to={`/gods/${deity.slug || deity.id}`}
          className="group block bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-orange-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
        >
          <div className="flex items-center gap-2 text-saffron font-bold text-xs uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Explore Deity
          </div>
          <div className="flex items-center gap-3.5 mb-3.5">
            <img
              src={deity.image || '/Deities/Krishna.png'}
              alt={deity.name}
              className="w-14 h-14 rounded-lg object-cover shadow-sm border-2 border-white shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-lg font-bold text-darkBrown group-hover:text-saffron transition-colors truncate">
                {deity.name}
              </h4>
              {deity.short_description && (
                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{deity.short_description}</p>
              )}
            </div>
          </div>
          <span className="inline-flex items-center justify-center w-full py-2 px-3 bg-saffron text-white rounded-md font-bold text-xs group-hover:brightness-90 transition-colors shadow-sm">
            View Deity Page <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </Link>
      )}

      {/* Recommended Bhajans */}
      {relatedBhajans.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-base font-bold text-darkBrown mb-3.5 flex items-center gap-2">
            <Music className="w-4 h-4 text-saffron" /> Recommended Bhajans
          </h3>
          <div className="flex flex-col gap-2.5">
            {relatedBhajans.map((bhajan) => (
              <Link
                key={bhajan.id}
                to={`/bhajans/${bhajan.slug || bhajan.id}`}
                className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9F7F3] transition-colors border border-transparent hover:border-gray-100"
              >
                <div className="relative aspect-video w-16 rounded-md overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                  <img
                    src={
                      bhajan.thumbnail_url ||
                      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150'
                    }
                    alt={bhajan.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-darkBrown group-hover:text-saffron transition-colors line-clamp-2">
                    {bhajan.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 font-medium">
                    <span className="truncate">{bhajan.god_name || bhajan.category_name || 'Bhajan'}</span>
                    {bhajan.views > 0 && (
                      <span className="flex items-center gap-0.5 shrink-0">
                        <Eye className="w-3 h-3" /> {bhajan.views}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-base font-bold text-darkBrown mb-3.5 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-saffron" /> Related Articles
          </h3>
          <div className="flex flex-col gap-3">
            {relatedArticles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug || article.id}`}
                className="group flex flex-col gap-2 p-3 rounded-lg hover:bg-[#F9F7F3] transition-colors border border-gray-100/60 overflow-hidden"
              >
                {article.featured_image_url && (
                  <div className="w-full aspect-video rounded-md overflow-hidden bg-gray-100">
                    <img
                      src={article.featured_image_url}
                      alt={article.displayTitle || article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <h4 className="text-xs md:text-sm font-bold text-darkBrown group-hover:text-saffron transition-colors line-clamp-2">
                  {article.displayTitle || article.title}
                </h4>
                {(article.displayExcerpt || article.excerpt) && (
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {article.displayExcerpt || article.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Festivals */}
      {relatedFestivals.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-base font-bold text-darkBrown mb-3.5 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-saffron" /> Related Festivals
          </h3>
          <div className="flex flex-col gap-2.5">
            {relatedFestivals.map((fest) => (
              <Link
                key={fest.id}
                to={`/festivals/${fest.slug || fest.id}`}
                className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[#F9F7F3] transition-colors border border-transparent hover:border-gray-100"
              >
                {fest.banner_image && (
                  <div className="aspect-video w-14 rounded-md overflow-hidden shrink-0 bg-gray-100">
                    <img
                      src={fest.banner_image}
                      alt={fest.displayName || fest.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-darkBrown group-hover:text-saffron transition-colors truncate">
                    {fest.displayName || fest.name}
                  </h4>
                  {fest.short_description && (
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{fest.short_description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
