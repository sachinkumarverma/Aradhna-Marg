import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchInput } from '../../../components/ui/SearchInput';
import { apiClient } from '../../../api/client';
import toast from 'react-hot-toast';
import {
  Folder, Image as ImageIcon, FileText,
  UploadCloud, Trash2, Download, Copy, Grid, List,
  ChevronRight, FolderPlus
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export const AdminMedia = () => {
  const queryClient = useQueryClient();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');

  // Fetch Folders
  const { data: folders = [], isLoading: loadingFolders } = useQuery({
    queryKey: ['media-folders', currentFolderId],
    queryFn: async () => {
      const res = await apiClient.get('/admin/media/folders', { params: { parentId: currentFolderId || undefined } });
      return res.data.data;
    }
  });

  // Fetch Files
  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ['media-files', currentFolderId, search],
    queryFn: async () => {
      const res = await apiClient.get('/admin/media/files', { params: { folderId: currentFolderId || undefined, search: search || undefined } });
      return res.data.data;
    }
  });

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId) formData.append('folderId', currentFolderId);
      const res = await apiClient.post('/admin/media/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('File uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
    },
    onError: () => toast.error('Failed to upload file')
  });

  // Dropzone Setup
  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => uploadMutation.mutate(file));
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: 'file' | 'folder' }) => {
      if (type === 'file') {
        await apiClient.delete(`/admin/media/files/${id}`);
      } else {
        await apiClient.delete(`/admin/media/folders/${id}`);
      }
    },
    onSuccess: (_, { type }) => {
      toast.success(`${type} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: type === 'file' ? ['media-files'] : ['media-folders'] });
    },
    onError: () => toast.error('Failed to delete')
  });

  // Create Folder Mutation
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiClient.post('/admin/media/folders', { name, parentId: currentFolderId });
    },
    onSuccess: () => {
      toast.success('Folder created');
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
    }
  });

  const handleCreateFolder = () => {
    const name = window.prompt('Enter folder name:');
    if (name) createFolderMutation.mutate(name);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const isLoading = loadingFolders || loadingFiles;

  return (
    <div className="space-y-6 flex flex-col flex-1 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 uppercase">
            <ImageIcon className="w-6 h-6 text-saffron" /> MEDIA LIBRARY
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage images, audio, and documents securely.</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <SearchInput
            placeholder="Search files..."
            value={search}
            onChange={setSearch}
            className="flex-1 max-w-md"
          />

          <button onClick={handleCreateFolder} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <FolderPlus className="w-4 h-4" /> New Folder
          </button>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <button onClick={() => setCurrentFolderId(null)} className="hover:text-saffron">Root</button>
        {currentFolderId && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-gray-900">Current Folder</span>
          </>
        )}
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-saffron bg-saffron/5' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-saffron' : 'text-gray-400'}`} />
        <p className="text-gray-700 font-medium">Drag & drop files here, or click to select</p>
        <p className="text-sm text-gray-500 mt-1">Supports images, pdfs, and documents</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500 animate-pulse">Loading media...</div>
      ) : (
        <div className="space-y-6">
          {/* Folders */}
          {folders.length > 0 && !search && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Folders</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {folders.map((folder: any) => (
                  <div
                    key={folder.id}
                    className="group bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md cursor-pointer transition-shadow"
                    onClick={() => setCurrentFolderId(folder.id)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Folder className="w-6 h-6 text-blue-500 shrink-0" />
                      <span className="font-medium text-gray-900 truncate">{folder.name}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: folder.id, type: 'folder' }); }}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {files.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Files</h3>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {files.map((file: any) => (
                    <div key={file.id} className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow relative">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center p-2 relative">
                        {file.thumbnailUrl ? (
                          <img src={file.thumbnailUrl} alt={file.fileName} className="w-full h-full object-cover rounded" />
                        ) : (
                          <FileText className="w-12 h-12 text-gray-400" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => copyUrl(file.url)} className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full">
                            <Copy className="w-4 h-4" />
                          </button>
                          <a href={file.url} target="_blank" download className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full">
                            <Download className="w-4 h-4" />
                          </a>
                          <button onClick={() => deleteMutation.mutate({ id: file.id, type: 'file' })} className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-gray-900 text-sm truncate" title={file.fileName}>{file.fileName}</p>
                        <p className="text-xs text-gray-500 mt-1">{(file.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Size</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {files.map((file: any) => (
                        <tr key={file.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 flex items-center gap-3">
                            {file.thumbnailUrl ? (
                              <img src={file.thumbnailUrl} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <FileText className="w-8 h-8 text-gray-400" />
                            )}
                            <span className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs">{file.fileName}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{(file.sizeBytes / 1024 / 1024).toFixed(2)} MB</td>
                          <td className="px-4 py-3 text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => copyUrl(file.url)} className="p-1.5 text-gray-500 hover:text-saffron hover:bg-saffron/10 rounded">
                                <Copy className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteMutation.mutate({ id: file.id, type: 'file' })} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loadingFiles && !loadingFolders && files.length === 0 && folders.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No media found</h3>
              <p className="text-gray-500 mt-1">Upload some files to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
