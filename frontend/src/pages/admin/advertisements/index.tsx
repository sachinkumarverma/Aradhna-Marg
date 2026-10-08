import React from 'react';
import { Plus, Megaphone } from 'lucide-react';

export function AdminAdvertisements() {
  return (
    <div className="space-y-6 flex flex-col flex-1 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-slate-900 flex items-center gap-2 uppercase truncate">
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-saffron shrink-0" />
            <span className="truncate">ADVERTISEMENTS</span>
          </h1>
          <p className="hidden sm:block text-gray-500 mt-1 text-sm">Manage ad placements and banners.</p>
        </div>

        <button
          title="Create Ad"
          aria-label="Create Ad"
          className="flex items-center justify-center h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3.5 bg-saffron text-white rounded-md hover:bg-golden transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline ml-1.5 text-xs font-semibold">Create Ad</span>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-md border border-gray-100 shadow-sm mt-8">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📢</span>
        </div>
        <h3 className="text-xl font-bold text-darkBrown mb-2">No Advertisements Found</h3>
        <p className="text-gray-500 mb-6 max-w-sm text-center">Get started by creating your first ad campaign.</p>
        <button className="px-5 py-2.5 bg-saffron text-white rounded-md font-medium hover:bg-golden transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Ad
        </button>
      </div>
    </div>
  );
}
