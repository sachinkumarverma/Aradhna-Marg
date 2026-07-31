import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, FileText, Globe, Key, LayoutDashboard, Search, Settings, ShieldAlert, ShieldCheck } from 'lucide-react';
import { SeoApi } from '@features/seo/SeoApi';
import { apiClient } from '@api/client';
import { cn } from '@utils/cn';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const JumpingDots = ({ colorClass = 'text-gray-400' }: { colorClass?: string }) => (
  <div className={`flex items-center gap-1.5 h-9 mt-2 ${colorClass}`}>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
);

export const AdminSEO = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['seo-overview'],
    queryFn: async () => {
      const data = await SeoApi.getOverview();
      return data.data;
    }
  });

  const { data: issues, isLoading: isLoadingIssues } = useQuery({
    queryKey: ['seo-issues'],
    queryFn: async () => {
      const data = await SeoApi.getIssues();
      return data.data;
    }
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/settings');
      return res.data.data;
    }
  });

  const handleSaveSettings = async (updates: any) => {
    try {
      await apiClient.put('/v1/settings', updates);
      toast.success('SEO settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleGenerateSitemap = async () => {
    try {
      await SeoApi.generateSitemap();
      toast.success('Sitemap generated successfully');
    } catch (error) {
      toast.error('Failed to generate sitemap');
    }
  };

  const handleGenerateRobots = async () => {
    try {
      await SeoApi.generateRobots();
      toast.success('robots.txt generated successfully');
    } catch (error) {
      toast.error('Failed to generate robots.txt');
    }
  };

  const handleGenerateBulk = async () => {
    try {
      await SeoApi.generateBulk();
      toast.success('Bulk generation job queued successfully in the background');
    } catch (error) {
      toast.error('Bulk generation failed to start');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Audit', icon: LayoutDashboard },
    { id: 'issues', label: 'SEO Issues', icon: ShieldAlert },
    { id: 'settings', label: 'Default SEO & Schema', icon: Settings },
    { id: 'tools', label: 'Tools (Sitemap & Robots)', icon: Globe },
    { id: 'generator', label: 'Bulk SEO Tools', icon: Search }
  ];

  return (
    <div className="space-y-6 flex flex-col flex-1 pb-8">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 uppercase">
              <Search className="w-6 h-6 text-saffron" />
              SEO ENGINE
            </h1>
            <p className="text-sm text-gray-500 mt-1">Monitor, audit, and manage global search engine optimization.</p>
          </div>
        </div>

        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-saffron text-saffron"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500">Total Bhajans</h3>
              {isLoadingOverview ? <JumpingDots /> : <p className="text-3xl font-bold mt-2">{overview?.totalBhajans || 0}</p>}
            </div>
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500">Total Articles</h3>
              {isLoadingOverview ? <JumpingDots /> : <p className="text-3xl font-bold mt-2">{overview?.totalArticles || 0}</p>}
            </div>
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500">Total Festivals</h3>
              {isLoadingOverview ? <JumpingDots /> : <p className="text-3xl font-bold mt-2">{overview?.totalFestivals || 0}</p>}
            </div>
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500">Total Puranas</h3>
              {isLoadingOverview ? <JumpingDots /> : <p className="text-3xl font-bold mt-2">{overview?.totalPuranas || 0}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-lg border border-red-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-red-600">Missing SEO Titles</h3>
                {isLoadingOverview ? <JumpingDots colorClass="text-red-400" /> : <p className="text-3xl font-bold text-red-700 mt-2">{overview?.missingTitles || 0}</p>}
              </div>
              <AlertTriangle className="w-10 h-10 text-red-200" />
            </div>
            <div className="bg-white p-5 rounded-lg border border-orange-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-orange-600">Duplicate Meta Descriptions</h3>
                {isLoadingOverview ? <JumpingDots colorClass="text-orange-400" /> : <p className="text-3xl font-bold text-orange-700 mt-2">{overview?.duplicateDescriptions || 0}</p>}
              </div>
              <FileText className="w-10 h-10 text-orange-200" />
            </div>
          </div>
          
          <h2 className="text-lg font-bold mt-8 mb-4">SEO Audit Health</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                   <th className="px-6 py-3 font-semibold">Content Type</th>
                   <th className="px-6 py-3 font-semibold text-center">Optimized</th>
                   <th className="px-6 py-3 font-semibold text-center">Missing Title</th>
                   <th className="px-6 py-3 font-semibold text-center">Missing Desc</th>
                   <th className="px-6 py-3 font-semibold text-center">Duplicate Title</th>
                 </tr>
               </thead>
               <tbody className="text-sm">
                 {isLoadingOverview ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-12">
                       <div className="flex flex-col items-center justify-center space-y-4">
                         <Activity className="w-8 h-8 text-saffron animate-bounce" />
                         <span className="text-gray-500 font-medium animate-pulse">Scanning content and auditing SEO metadata...</span>
                       </div>
                     </td>
                   </tr>
                 ) : (
                   overview?.audit?.map((item: any) => (
                     <tr key={item.type} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                       <td className="px-6 py-4 font-medium text-gray-900 capitalize">{item.type}</td>
                       <td className="px-6 py-4 text-center text-green-600 font-medium">{item.optimized}</td>
                       <td className="px-6 py-4 text-center text-red-600 font-medium cursor-pointer hover:underline" onClick={() => navigate(`/admin/${item.type}?filter=missingTitle`)}>{item.missingTitle}</td>
                       <td className="px-6 py-4 text-center text-red-600 font-medium cursor-pointer hover:underline" onClick={() => navigate(`/admin/${item.type}?filter=missingDesc`)}>{item.missingDesc}</td>
                       <td className="px-6 py-4 text-center text-orange-500 font-medium cursor-pointer hover:underline" onClick={() => navigate(`/admin/${item.type}?filter=duplicateTitle`)}>{item.duplicateTitle}</td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="px-6 py-3 font-semibold">Content Type</th>
                <th className="px-6 py-3 font-semibold">Title</th>
                <th className="px-6 py-3 font-semibold">Issue</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoadingIssues ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Search className="w-8 h-8 text-gray-300 animate-bounce" />
                      <span className="text-gray-400 font-medium animate-pulse">Fetching SEO issues...</span>
                    </div>
                  </td>
                </tr>
              ) : issues?.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Excellent!</h3>
                  <p>All content is currently optimized. No SEO issues found.</p>
                </td></tr>
              ) : (
                issues?.map((issue: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 capitalize">{issue.type}</td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">{issue.title}</td>
                    <td className="px-6 py-4 text-red-500 font-medium">{issue.issue}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/admin/${issue.type}/${issue.id}/edit`} className="text-saffron hover:underline font-medium">Fix Issue</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
            <h3 className="font-bold text-gray-900 border-b pb-3">Default SEO Fallbacks</h3>
            <p className="text-xs text-gray-500 mb-4">These values will act as fallbacks when content-specific SEO fields are empty.</p>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Default Site Title</label>
              <input 
                type="text" 
                defaultValue={settings?.seoSiteTitle}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Default Meta Description</label>
              <textarea 
                rows={4}
                defaultValue={settings?.seoMetaDescription}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none text-sm focus:border-saffron focus:ring-1 focus:ring-saffron resize-y" 
              />
            </div>
            <button className="px-4 py-2 bg-saffron text-white rounded-lg font-medium hover:bg-saffron/90 w-full mt-2">
              Save Default SEO
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
            <h3 className="font-bold text-gray-900 border-b pb-3">Structured Data (Schema.org)</h3>
            <p className="text-xs text-gray-500 mb-4">The backend will automatically determine the correct schema fields for each page type. These switches simply enable or disable schema generation globally.</p>
            
            <div className="space-y-4">
              {[
                { key: 'schemaOrganization', label: 'Organization Schema' },
                { key: 'schemaWebsite', label: 'Website Schema' },
                { key: 'schemaBreadcrumb', label: 'Breadcrumb Schema' },
                { key: 'schemaArticle', label: 'Article Schema' },
                { key: 'schemaSearchAction', label: 'SearchAction Schema' }
              ].map((schema) => (
                <label key={schema.key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">{schema.label}</span>
                  <div className="relative">
                    <input type="checkbox" defaultChecked={settings?.[schema.key]} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saffron"></div>
                  </div>
                </label>
              ))}
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 w-full mt-2">
              Save Schema Settings
            </button>
          </div>
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">XML Sitemap</h3>
            <p className="text-sm text-gray-500 mb-6">
              Generate an updated XML sitemap for search engines. <br/>
              Last generated: <strong>{settings?.sitemapLastGenerated ? new Date(settings.sitemapLastGenerated).toLocaleDateString() : 'Never'}</strong> <br/>
              URLs: <strong>{settings?.sitemapUrlsCount || 0}</strong> <br/>
              Status: <strong className="text-green-600">Available</strong>
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={handleGenerateSitemap} className="flex-1 px-4 py-2 bg-saffron text-white rounded-lg font-medium hover:bg-saffron/90">
                Generate
              </button>
              <a href="/sitemap.xml" download className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 block text-center">
                Download
              </a>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Robots.txt</h3>
            <p className="text-sm text-gray-500 mb-6">Automatically generate a standard robots.txt file to guide search engine crawlers properly.</p>
            <button onClick={handleGenerateRobots} className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 mt-auto">
              Generate robots.txt
            </button>
          </div>
        </div>
      )}

      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-saffron" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Bulk SEO Tools</h2>
            <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
              Automatically generate missing SEO titles and meta descriptions for all content in the background. 
              This process will <strong>never</strong> overwrite manually entered SEO values. It will generate values <strong>only when</strong> the SEO Title or Meta Description is empty.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-left space-y-4 mb-8">
              <h4 className="font-semibold text-gray-900">Select content to generate:</h4>
              <div className="grid grid-cols-2 gap-3">
                {['Bhajans', 'Articles', 'Festivals', 'Puranas', 'Categories'].map(item => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="text-saffron rounded border-gray-300 focus:ring-saffron" />
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={handleGenerateBulk} className="px-6 py-3 bg-saffron text-white rounded-lg font-bold hover:bg-saffron/90 w-full shadow-sm text-lg flex items-center justify-center gap-2 transition-colors">
              Start Bulk Generation Job
            </button>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Background Job Status</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg divide-y divide-gray-100 text-center">
              <div className="p-8 text-gray-500">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No SEO generation jobs have been executed yet.</p>
              </div>
              {/* Future statuses: Queued, Running, Completed, Failed */}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
