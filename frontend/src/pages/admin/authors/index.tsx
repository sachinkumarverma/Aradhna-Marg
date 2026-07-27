import React from 'react';
import { Plus } from 'lucide-react';

export function AdminAuthors() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-darkBrown">Authors</h1>
          
          <p className="text-gray-500 mt-1 text-sm">
            Manage content authors and spiritual masters.
          </p>
        </div>
        
        <button
          className="flex items-center gap-2 px-4 py-2 bg-saffron text-white rounded-lg hover:bg-golden transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Author
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm mt-8">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">✍️</span>
        </div>
        <h3 className="text-xl font-bold text-darkBrown mb-2">No Authors Found</h3>
        <p className="text-gray-500 mb-6 max-w-sm text-center">
          Get started by adding authors to the platform.
        </p>
        <button className="px-5 py-2.5 bg-saffron text-white rounded-lg font-medium hover:bg-golden transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Author
        </button>
      </div>
    </div>
  );
}
