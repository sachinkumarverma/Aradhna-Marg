import React from 'react';

/**
 * Shimmer pulse placeholder for Home Page & List Page Videos
 */
export const VideoCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col md:flex-row gap-5 items-stretch animate-pulse">
    <div className="aspect-video w-full md:w-60 lg:w-64 rounded-lg bg-gray-200 shrink-0" />
    <div className="flex-1 flex flex-col justify-between py-1 gap-3 min-w-0">
      <div>
        <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2.5" />
        <div className="h-3 bg-gray-100 rounded-md w-1/3 mb-3" />
        <div className="h-10 bg-amber-50/70 border-l-2 border-amber-200 rounded-r-lg p-2 flex flex-col gap-1.5">
          <div className="h-2.5 bg-gray-200/80 rounded w-full" />
          <div className="h-2.5 bg-gray-200/80 rounded w-4/5" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded-md w-16" />
          <div className="h-5 bg-gray-100 rounded-md w-12" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
    </div>
  </div>
);

/**
 * Shimmer pulse for Trending Bhajans Sidebar on Home Page
 */
export const TrendingBhajanSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
    <div className="w-11 h-11 rounded-lg bg-gray-200 shrink-0" />
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
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs flex flex-col h-full animate-pulse">
    <div className="aspect-[16/10] w-full bg-gray-200" />
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
  <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex flex-col h-full animate-pulse">
    <div className="aspect-[3/4] w-full rounded-xl bg-gray-200 mb-3" />
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
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs flex flex-col h-full animate-pulse">
    <div className="aspect-[16/10] w-full bg-gray-200" />
    <div className="p-4 flex flex-col gap-2.5 flex-1 justify-between">
      <div>
        <div className="h-3 bg-amber-100 rounded w-20 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-1.5" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-12" />
        <div className="h-3 bg-gray-200 rounded w-14" />
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
