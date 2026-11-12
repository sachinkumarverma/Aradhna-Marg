import React from 'react';

/**
 * Shimmer pulse placeholder for Home Page & List Page Videos
 */
export const VideoCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-3 sm:p-5 border border-gray-100 shadow-xs flex flex-row gap-3 sm:gap-5 items-stretch animate-pulse">
    <div className="aspect-video w-[125px] xs:w-[150px] sm:w-60 md:w-72 lg:w-80 rounded-lg bg-gray-200 shrink-0 self-center" />
    <div className="flex-1 flex flex-col justify-between py-0.5 sm:py-1 gap-2 sm:gap-3 min-w-0">
      <div>
        <div className="h-4 sm:h-5 bg-gray-200 rounded-md w-3/4 mb-1.5 sm:mb-2.5" />
        <div className="h-2.5 sm:h-3 bg-gray-100 rounded-md w-1/3 mb-2 sm:mb-3" />
        <div className="h-8 sm:h-10 bg-amber-50/70 border-l-2 border-amber-200 rounded-r-lg p-1.5 sm:p-2 flex flex-col gap-1 sm:gap-1.5">
          <div className="h-2 sm:h-2.5 bg-gray-200/80 rounded w-full" />
          <div className="h-2 sm:h-2.5 bg-gray-200/80 rounded w-4/5" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-gray-100">
        <div className="flex gap-2">
          <div className="h-4 sm:h-5 bg-gray-200 rounded-md w-12 sm:w-16" />
          <div className="h-4 sm:h-5 bg-gray-100 rounded-md w-10 sm:w-12" />
        </div>
        <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-12 sm:w-16" />
      </div>
    </div>
  </div>
);

/**
 * Shimmer pulse for Trending Bhajans Sidebar on Home Page
 */
export const TrendingBhajanSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
    <div className="w-20 aspect-video rounded-lg bg-gray-200 shrink-0" />
    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
      <div className="h-3.5 bg-gray-200 rounded-md w-3/4" />
      <div className="h-2.5 bg-gray-100 rounded-md w-1/2" />
    </div>
  </div>
);

/**
 * Shimmer pulse for Spiritual Articles Cards
 */
export const ArticleCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-xs flex flex-col h-full animate-pulse">
    <div className="aspect-video w-full bg-gray-200" />
    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
      <div>
        <div className="h-4 bg-amber-100 rounded-md w-20 mb-3" />
        <div className="h-5 bg-gray-200 rounded-md w-5/6 mb-2" />
        <div className="h-3 bg-gray-100 rounded-md w-full mb-1" />
        <div className="h-3 bg-gray-100 rounded-md w-2/3" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-3 bg-amber-200 rounded w-16" />
      </div>
    </div>
  </div>
);

/**
 * Shimmer pulse for Purana / Scripture Cards
 */
export const PuranaCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col h-full animate-pulse">
    <div className="aspect-[3/4] w-full rounded-lg bg-gray-200 mb-3" />
    <div className="h-4 bg-gray-200 rounded-md w-3/4 mb-2" />
    <div className="h-2.5 bg-gray-100 rounded-md w-full mb-1" />
    <div className="h-2.5 bg-gray-100 rounded-md w-2/3" />
  </div>
);

/**
 * Shimmer pulse for Festival Cards
 */
export const FestivalCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-4 border border-orange-100/80 shadow-xs flex items-center gap-4 animate-pulse">
    <div className="aspect-video w-20 rounded-lg bg-gray-200 shrink-0" />
    <div className="flex-1 flex flex-col gap-2 min-w-0">
      <div className="h-4 bg-gray-200 rounded-md w-2/3" />
      <div className="h-2.5 bg-gray-100 rounded-md w-full" />
      <div className="h-2.5 bg-gray-100 rounded-md w-4/5" />
    </div>
  </div>
);

/**
 * Shimmer pulse for Bhajan Grid Cards
 */
export const BhajanCardSkeleton: React.FC = () => (
  <div className="bg-gradient-to-b from-[#FFFDF9] via-white to-[#FFF9EE] rounded-xl overflow-hidden border border-amber-100/90 shadow-xs flex flex-col h-full animate-pulse">
    {/* Devotional Thumbnail Header */}
    <div className="aspect-video w-full bg-amber-100/50 border-b border-amber-100/40" />

    {/* Devotional Content Area */}
    <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
      <div>
        <div className="pt-0.5 pb-0.5 flex flex-col justify-center gap-1.5">
          <div className="h-4 bg-amber-200/50 rounded-md w-5/6" />
          <div className="h-4 bg-amber-200/40 rounded-md w-2/3" />
        </div>
      </div>

      {/* Devotional Footer */}
      <div className="mt-3 pt-2.5 border-t border-amber-100/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-amber-100/60" />
          <div className="w-7 h-7 rounded-full bg-amber-100/60" />
          <div className="w-7 h-7 rounded-full bg-amber-100/60" />
        </div>
        <div className="h-6 bg-amber-200/60 rounded-full w-24" />
      </div>
    </div>
  </div>
);

/**
 * Shimmer pulse for Video Grid Cards
 */
export const VideoGridCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs flex flex-col h-full animate-pulse">
    <div className="aspect-video w-full bg-gray-200" />
    <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
      <div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-16" />
        <div className="h-3 bg-gray-200 rounded w-12" />
      </div>
    </div>
  </div>
);

/**
 * Shimmer pulse placeholder for Festival Detail Page (Mobile, Tablet, Desktop responsive)
 */
export const FestivalDetailSkeleton: React.FC = () => (
  <div className="w-full min-h-screen bg-[#F9F7F3] pt-2 sm:pt-3 md:pt-4 pb-16 sm:pb-24 animate-pulse">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-3.5 sm:mb-6">
        <div className="h-4 bg-gray-200 rounded w-14" />
        <div className="h-3.5 bg-gray-200 rounded w-3" />
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-3.5 bg-gray-200 rounded w-3" />
        <div className="h-4 bg-amber-200/80 rounded w-28 sm:w-36" />
      </div>

      {/* Responsive 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column (8 Columns on Desktop) */}
        <div className="lg:col-span-8 min-w-0 w-full flex flex-col gap-6">
          <div className="bg-white rounded-xl p-4 sm:p-8 md:p-10 border border-gray-100 shadow-xs">
            {/* Header Title & Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="h-7 sm:h-9 bg-gray-200 rounded-lg w-3/4 sm:w-1/2" />
              <div className="flex gap-2">
                <div className="h-6 bg-amber-100 rounded-full w-24" />
                <div className="h-6 bg-orange-100 rounded-full w-28" />
              </div>
            </div>

            {/* Short Description */}
            <div className="space-y-2 mb-6 border-b border-gray-100 pb-5">
              <div className="h-4 bg-gray-200/80 rounded w-full" />
              <div className="h-4 bg-gray-200/80 rounded w-4/5" />
            </div>

            {/* Banner Image */}
            <div className="w-full aspect-video rounded-lg bg-gray-200 mb-8" />

            {/* Rich Content Lines */}
            <div className="space-y-3.5">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-3.5 bg-gray-200/70 rounded w-full" />
              <div className="h-3.5 bg-gray-200/70 rounded w-full" />
              <div className="h-3.5 bg-gray-200/70 rounded w-11/12" />
              <div className="h-3.5 bg-gray-200/70 rounded w-4/5 mb-6" />
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-3.5 bg-gray-200/70 rounded w-full" />
              <div className="h-3.5 bg-gray-200/70 rounded w-5/6" />
            </div>
          </div>
        </div>

        {/* Right Sidebar (4 Columns on Desktop, Stacks on Tablet/Mobile) */}
        <div className="lg:col-span-4 w-full flex flex-col gap-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs">
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="flex flex-col gap-3.5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex gap-3 items-center">
                  <div className="w-16 h-12 rounded-lg bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded w-4/5" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Shimmer pulse placeholder for Bhajan & Video Detail Page (Mobile, Tablet, Desktop responsive)
 */
export const BhajanDetailSkeleton: React.FC = () => (
  <div className="w-full min-h-screen bg-[#F9F7F3] pt-2 sm:pt-3 md:pt-4 pb-16 sm:pb-24 animate-pulse">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-3.5 sm:mb-6">
        <div className="h-4 bg-gray-200 rounded w-14" />
        <div className="h-3.5 bg-gray-200 rounded w-3" />
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-3.5 bg-gray-200 rounded w-3" />
        <div className="h-4 bg-amber-200/80 rounded w-36" />
      </div>

      {/* Responsive 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          {/* Video Player / Hero Thumbnail Skeleton */}
          <div className="w-full aspect-video rounded-xl bg-stone-900/30 overflow-hidden" />

          {/* Action Tabs & Controls Skeleton */}
          <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-amber-100 shadow-2xs">
            <div className="flex gap-2">
              <div className="h-8 bg-amber-100/70 rounded-lg w-20 sm:w-24" />
              <div className="h-8 bg-gray-100 rounded-lg w-20 sm:w-24" />
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100" />
              <div className="w-8 h-8 rounded-full bg-gray-100" />
            </div>
          </div>

          {/* Lyrics Stanzas Skeleton */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-amber-100 shadow-xs space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-4.5 bg-amber-100/60 rounded w-3/5 sm:w-1/2 mx-auto" />
            <div className="h-4.5 bg-amber-100/60 rounded w-4/5 sm:w-3/5 mx-auto" />
            <div className="h-4.5 bg-amber-100/60 rounded w-1/2 sm:w-2/5 mx-auto mb-6" />
            <div className="h-4.5 bg-amber-100/60 rounded w-3/5 sm:w-1/2 mx-auto" />
            <div className="h-4.5 bg-amber-100/60 rounded w-4/5 sm:w-3/5 mx-auto" />
          </div>
        </div>

        {/* Right Sidebar (4 Columns) */}
        <div className="lg:col-span-4 w-full flex flex-col gap-6">
          <div className="bg-stone-900/80 rounded-xl p-5 text-white shadow-xs space-y-3">
            <div className="h-5 bg-stone-700 rounded w-1/3" />
            <div className="h-6 bg-stone-600 rounded w-3/4" />
            <div className="h-4 bg-stone-700 rounded w-1/2" />
          </div>

          <div className="bg-white rounded-xl p-5 border border-amber-100 shadow-xs">
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex gap-3 items-center">
                  <div className="w-16 h-12 rounded-lg bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded w-4/5" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Shimmer pulse placeholder for Article Detail Page (Mobile, Tablet, Desktop responsive)
 */
export const ArticleDetailSkeleton: React.FC = () => (
  <div className="w-full min-h-screen bg-[#F9F7F3] pt-2 sm:pt-3 md:pt-4 pb-16 sm:pb-24 animate-pulse">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-3.5 sm:mb-6">
        <div className="h-4 bg-gray-200 rounded w-14" />
        <div className="h-3.5 bg-gray-200 rounded w-3" />
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-3.5 bg-gray-200 rounded w-3" />
        <div className="h-4 bg-amber-200/80 rounded w-28 sm:w-36" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column (8 Columns) */}
        <div className="lg:col-span-8 min-w-0 w-full flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-5 sm:p-8 border border-gray-100 shadow-xs">
            {/* Meta row */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="h-6 bg-amber-100 rounded-full w-24" />
              <div className="h-4 bg-gray-100 rounded w-28" />
            </div>

            {/* Title */}
            <div className="space-y-2 mb-5">
              <div className="h-7 sm:h-9 bg-gray-200 rounded-lg w-full" />
              <div className="h-7 sm:h-9 bg-gray-200 rounded-lg w-4/5" />
            </div>

            {/* Featured Image */}
            <div className="w-full aspect-video rounded-xl bg-gray-200 mb-6" />

            {/* Paragraphs */}
            <div className="space-y-3.5">
              <div className="h-3.5 bg-gray-200/70 rounded w-full" />
              <div className="h-3.5 bg-gray-200/70 rounded w-full" />
              <div className="h-3.5 bg-gray-200/70 rounded w-11/12" />
              <div className="h-3.5 bg-gray-200/70 rounded w-3/4 mb-5" />
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3.5 bg-gray-200/70 rounded w-full" />
              <div className="h-3.5 bg-gray-200/70 rounded w-5/6" />
            </div>
          </div>
        </div>

        {/* Right Sidebar (4 Columns) */}
        <div className="lg:col-span-4 w-full flex flex-col gap-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs">
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex gap-3 items-center">
                  <div className="w-16 h-12 rounded-lg bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded w-4/5" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Shimmer pulse placeholder for Scripture / Purana Detail Page (Mobile, Tablet, Desktop responsive)
 */
export const PuranaDetailSkeleton: React.FC = () => (
  <div className="w-full min-h-screen bg-[#F9F7F3] pt-2 sm:pt-3 md:pt-4 pb-16 sm:pb-24 animate-pulse">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-3.5 sm:mb-6">
        <div className="h-4 bg-gray-200 rounded w-14" />
        <div className="h-3.5 bg-gray-200 rounded w-3" />
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-3.5 bg-gray-200 rounded w-3" />
        <div className="h-4 bg-amber-200/80 rounded w-28" />
      </div>

      <div className="bg-white rounded-2xl p-5 sm:p-8 border border-orange-100/80 shadow-xs flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
        <div className="w-36 sm:w-48 aspect-[3/4] rounded-xl bg-gray-200 shrink-0 mx-auto md:mx-0 shadow-sm" />
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="h-7 sm:h-9 bg-gray-200 rounded-lg w-3/4 mb-3" />
            <div className="h-4 bg-amber-100 rounded w-1/3 mb-4" />
            <div className="space-y-2 mb-6">
              <div className="h-3.5 bg-gray-200/70 rounded w-full" />
              <div className="h-3.5 bg-gray-200/70 rounded w-11/12" />
              <div className="h-3.5 bg-gray-200/70 rounded w-4/5" />
            </div>
          </div>
          <div className="h-10 sm:h-11 bg-saffron/30 rounded-lg w-36 sm:w-44" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Shimmer pulse placeholder for Deity / Category Collection Page (Mobile, Tablet, Desktop responsive)
 */
export const CollectionDetailSkeleton: React.FC = () => (
  <div className="w-full min-h-screen bg-[#F9F7F3] pb-16 animate-pulse">
    {/* Dark Brown Collection Hero Header */}
    <div className="bg-gradient-to-br from-darkBrown to-[#3d2b1f] text-cream pt-4 sm:pt-6 md:pt-10 pb-8 sm:pb-12 md:pb-14 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <div className="h-3.5 bg-cream/20 rounded w-14" />
          <div className="h-3 bg-cream/20 rounded w-2.5" />
          <div className="h-3.5 bg-cream/20 rounded w-16" />
          <div className="h-3 bg-cream/20 rounded w-2.5" />
          <div className="h-3.5 bg-saffron/40 rounded w-28" />
        </div>

        {/* Title */}
        <div className="h-8 sm:h-10 md:h-12 bg-white/20 rounded-lg w-3/4 sm:w-1/3 mb-4" />

        {/* Short Description */}
        <div className="space-y-2 max-w-2xl mb-8">
          <div className="h-4 bg-cream/15 rounded w-full" />
          <div className="h-4 bg-cream/15 rounded w-4/5" />
        </div>

        {/* Stats Pill Row */}
        <div className="flex items-center gap-4 sm:gap-8 pt-2 border-t border-cream/10">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-col gap-1">
              <div className="h-5 sm:h-6 bg-saffron/30 rounded w-8" />
              <div className="h-3 bg-cream/20 rounded w-16 sm:w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Content Cards Grid */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-8">
      <div>
        <div className="h-6 sm:h-7 bg-gray-200 rounded w-44 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {[1, 2, 3, 4].map((n) => (
            <BhajanCardSkeleton key={n} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

/**
 * Universal Responsive List Page Skeleton for Mobile, Tablet, and Desktop
 */
export const ListPageSkeleton: React.FC = () => (
  <div className="w-full min-h-screen bg-[#F9F7F3] pb-16 animate-pulse">
    <div className="bg-gradient-to-b from-amber-50/70 to-transparent py-8 sm:py-12 border-b border-amber-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-7 sm:h-9 bg-gray-200 rounded-lg w-48 mb-2 mx-auto sm:mx-0" />
          <div className="h-4 bg-gray-200/70 rounded w-64 mx-auto sm:mx-0" />
        </div>
        <div className="h-10 bg-white rounded-full border border-gray-200 w-44 mx-auto sm:mx-0" />
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
            <div className="w-full aspect-video rounded-lg bg-gray-200" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
