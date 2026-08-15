import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, Eye, BookOpen, FileText } from 'lucide-react';
import { apiClient } from '@api/client';
import toast from 'react-hot-toast';

export const PuranDetail: React.FC = () => {
  const { slug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['puran-public', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/v1/puranas/${slug}`);
      return res.data.data;
    },
    enabled: !!slug
  });

  const trackViewMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/v1/puranas/${id}/view`)
  });

  const trackDownloadMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/v1/puranas/${id}/download`)
  });

  // Track view once loaded
  useEffect(() => {
    if (data?.id) {
      trackViewMutation.mutate(data.id);
    }
  }, [data?.id]);

  const handlePdfAction = async (action: 'view' | 'download') => {
    if (!data?.id || !data?.pdf_file) return;

    try {
      if (action === 'view') {
        // View tracking is also done on load, but we can track explicit views if needed.
        handleView();
      } else {
        trackDownloadMutation.mutate(data.id);
      }

      let finalUrl = data.pdf_file;
      if (!finalUrl.startsWith('http')) {
        const res = await apiClient.get(`/v1/puranas/${data.id}/pdf`);
        finalUrl = res.data.data.url;
      }

      if (finalUrl) {
        if (action === 'download') {
          const a = document.createElement('a');
          a.href = finalUrl;
          a.download = '';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          window.open(finalUrl, '_blank');
        }
      }
    } catch (err) {
      toast.error('Failed to load PDF securely.');
    }
  };

  const handleView = () => {
    // Optional additional view logic
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800">Purana not found</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="md:flex">
            {/* Cover Image */}
            <div className="md:w-1/3 bg-gray-100 flex items-center justify-center p-6 md:p-0 border-b md:border-b-0 md:border-r border-gray-100">
              {data.cover_image ? (
                <img src={data.cover_image} alt={data.title} className="w-full h-auto object-cover max-h-96" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-12">
                  <BookOpen className="w-16 h-16 mb-4" />
                  <span className="text-sm font-medium">No Cover</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-8 md:w-2/3 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-saffron/10 text-saffron px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {data.language || 'Unknown Language'}
                </span>
                {data.author && <span className="text-gray-500 text-sm font-medium">By {data.author}</span>}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-serif">{data.title}</h1>

              <div className="flex items-center gap-6 text-sm text-gray-600 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{data.view_count?.toLocaleString() || 0} Views</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{data.download_count?.toLocaleString() || 0} Downloads</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {data.short_description && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-4">About this Purana</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{data.short_description}</div>
          </div>
        )}

        {/* Actions Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12 flex flex-col sm:flex-row items-center gap-4 justify-center">
          <button
            onClick={() => handlePdfAction('view')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium shadow-sm"
          >
            <FileText className="w-5 h-5" />
            View PDF
          </button>
          <button
            onClick={() => handlePdfAction('download')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-saffron text-white rounded-md hover:bg-saffron/90 transition-colors font-medium shadow-sm"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </div>

        {/* Related Puranas */}
        {data.related && data.related.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Related Puranas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.related.map((puran: any) => (
                <Link
                  to={`/puranas/${puran.slug}`}
                  key={puran.id}
                  className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {puran.cover_image ? (
                      <img
                        src={puran.cover_image}
                        alt={puran.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <BookOpen className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-bold text-saffron uppercase tracking-wider mb-1 block">
                      {puran.language}
                    </span>
                    <h4 className="font-bold text-gray-900 line-clamp-2">{puran.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
