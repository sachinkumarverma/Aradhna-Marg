import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { SearchBar } from '@components/search/SearchBar';
import { useSearch } from '@hooks/useSearch';
import { useTranslation } from '../../i18n/LanguageContext';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [sort, setSort] = useState('RELEVANCE');
  const { t } = useTranslation();

  // Execute search hook
  const { data, isLoading, isError } = useSearch(query, {}, sort, 1);

  const getTargetUrl = (item: any) => {
    switch (item.type) {
      case 'BHAJAN':
        return `/bhajans/${item.slug || item.id}`;
      case 'ARTICLE':
        return `/articles/${item.slug || item.id}`;
      case 'FESTIVAL':
        return `/festivals/${item.slug || item.id}`;
      case 'PURANA':
        return `/puranas/${item.slug || item.id}`;
      case 'DEITY':
        return `/gods/${item.slug || item.id}`;
      default:
        return `/bhajans/${item.slug || item.id}`;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F9F7F3] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Search Input */}
        <div className="mb-10 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-darkBrown tracking-tight mb-6 font-hindi-heading leading-tight">
            {t('content.searchTitle')}
          </h1>
          <SearchBar />
        </div>

        {/* Results Area */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-6">
            <span className="text-base font-bold text-slate-600">
              {isLoading ? t('common.loading') : query ? `"${query}" - ${data?.length || 0}` : t('content.searchTitle')}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-saffron" />
            </div>
          ) : isError ? (
            <div className="text-center py-20 text-red-500 font-bold">{t('errors.failedToLoad')}</div>
          ) : data && data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map((item: any, i: number) => (
                <Link
                  key={item.id || i}
                  to={getTargetUrl(item)}
                  className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-saffron/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-amber-50 text-saffron font-bold text-xs rounded-full border border-amber-200">
                        {item.type_label || item.type}
                      </span>
                      {item.views > 0 && <span className="text-xs text-slate-400 font-medium">{item.views} views</span>}
                    </div>

                    <h3 className="text-xl font-bold text-darkBrown mb-2 group-hover:text-saffron transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    {item.excerpt && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">{item.excerpt}</p>
                    )}
                  </div>

                  <span className="inline-flex items-center text-xs font-bold text-saffron pt-3 border-t border-gray-100 group-hover:underline">
                    {t('common.read')} &rarr;
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8 max-w-xl mx-auto">
              <SearchIcon className="w-12 h-12 text-saffron mx-auto mb-4" />
              <h3 className="text-xl font-bold text-darkBrown mb-2">{t('empty.noResults')}</h3>
              <p className="text-slate-500 text-sm">{t('empty.noResultsDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
