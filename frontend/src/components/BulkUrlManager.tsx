'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, Trash2, ExternalLink } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

interface BulkUrl {
  id: string;
  originalUrl: string;
  shortUrl?: string;
  shortCode?: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export default function BulkUrlManager() {
  const [urls, setUrls] = useState<BulkUrl[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const newUrls: BulkUrl[] = lines
          .slice(1) // Skip header
          .filter(line => line.trim())
          .map((line, index) => ({
            id: `bulk-${Date.now()}-${index}`,
            originalUrl: line.trim().split(',')[0] || line.trim(),
            status: 'pending' as const
          }));
        
        setUrls(newUrls);
        toast.success(`Loaded ${newUrls.length} URLs from CSV`);
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (urls: BulkUrl[]) => {
      const results = await Promise.allSettled(
        urls.map(url => 
          axios.post('http://localhost:3000/api/v1/urls', {
            originalUrl: url.originalUrl
          })
        )
      );
      return results;
    },
    onSuccess: (results) => {
      setUrls(prev => prev.map((url, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          return {
            ...url,
            shortUrl: result.value.data.data.shortUrl,
            shortCode: result.value.data.data.shortCode,
            status: 'success' as const
          };
        } else {
          return {
            ...url,
            status: 'error' as const,
            error: result.reason?.response?.data?.message || 'Failed to shorten'
          };
        }
      }));
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      toast.success(`Successfully shortened ${successCount}/${results.length} URLs`);
    }
  });

  const processBulkUrls = async () => {
    if (urls.length === 0) return;
    setIsProcessing(true);
    await bulkCreateMutation.mutateAsync(urls);
    setIsProcessing(false);
  };

  const exportResults = () => {
    const csvContent = [
      ['Original URL', 'Short URL', 'Short Code', 'Status', 'Error'],
      ...urls.map(url => [
        url.originalUrl,
        url.shortUrl || '',
        url.shortCode || '',
        url.status,
        url.error || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quicklink-bulk-results-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Results exported successfully!');
  };

  const clearAll = () => {
    setUrls([]);
    toast.success('All URLs cleared');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-3xl mr-3">📁</span>
          Bulk URL Manager
        </h2>

        {/* CSV Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Upload CSV File
          </h3>
          <p className="text-gray-500">
            Drop your CSV file here, or click to select
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Format: One URL per line or CSV with URL column
          </p>
        </div>

        {/* Bulk Actions */}
        {urls.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={processBulkUrls}
              disabled={isProcessing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  <span>Shorten All URLs ({urls.length})</span>
                </>
              )}
            </button>

            <button
              onClick={exportResults}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export Results</span>
            </button>

            <button
              onClick={clearAll}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Table */}
      {urls.length > 0 && (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Processing Results ({urls.length} URLs)
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Short URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {urls.map((url) => (
                  <tr key={url.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {url.originalUrl}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {url.shortUrl ? (
                        <a 
                          href={url.shortUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-mono"
                        >
                          {url.shortUrl}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        url.status === 'success' 
                          ? 'bg-green-100 text-green-800'
                          : url.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {url.status === 'pending' && '⏳ Pending'}
                        {url.status === 'success' && '✅ Success'}
                        {url.status === 'error' && `❌ ${url.error}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
