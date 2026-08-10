import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Languages, AlertCircle, FileText, CheckCircle2, Search } from 'lucide-react';
import { TranslationApi } from '@features/translations/TranslationApi';

export const AdminTranslations = () => {
  const { data: stats } = useQuery({
    queryKey: ['translation-stats'],
    queryFn: async () => {
      // Stub until implemented on backend
      return { total: 0, pending: 0, approved: 0 }; 
    }
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Languages className="w-6 h-6 text-indigo-600" />
            Translation Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage multilingual content across Articles, Puranas, and Festivals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Translations</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Needs Review</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.pending || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Approved</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.approved || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search translations..." 
              className="w-full pl-9 pr-4 py-2 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <select className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">All Types</option>
              <option value="ARTICLE">Articles</option>
              <option value="PURAN">Puranas</option>
              <option value="FESTIVAL">Festivals</option>
            </select>
          </div>
        </div>

        <div className="p-8 text-center text-gray-500">
          <Languages className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No translations found</h3>
          <p className="text-sm">Generate translations from the content editors to see them here.</p>
        </div>
      </div>
    </div>
  );
};
