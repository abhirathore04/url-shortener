'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function UrlShortener() {
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [result, setResult] = useState<any>(null);

  const createUrlMutation = useMutation({
    mutationFn: async (data: { originalUrl: string; customAlias?: string }) => {
      const response = await axios.post('http://localhost:3000/api/v1/urls', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setUrl('');
      setCustomAlias('');
      toast.success('URL shortened successfully! 🎉');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to shorten URL';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      createUrlMutation.mutate({
        originalUrl: url.trim(),
        customAlias: customAlias.trim() || undefined,
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard! 📋');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔗</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Shorten Your URL</h2>
          <p className="text-gray-600">Transform long URLs into short, manageable links instantly</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Long URL *
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very-long-url-that-needs-shortening"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
              disabled={createUrlMutation.isPending}
            />
          </div>

          {/* Custom Alias Input */}
          <div>
            <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-2">
              Custom Alias (Optional)
            </label>
            <input
              id="alias"
              type="text"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              placeholder="my-custom-link"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={createUrlMutation.isPending}
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty for auto-generated short code
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createUrlMutation.isPending || !url.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {createUrlMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Shortening...
              </>
            ) : (
              <>
                <span className="mr-2">⚡</span>
                Shorten URL
              </>
            )}
          </button>
        </form>
      </div>

      {/* Result Card */}
      {result && (
        <div className="mt-8 bg-green-50 rounded-xl border border-green-200 p-6 animate-slide-up">
          <div className="flex items-start space-x-3">
            <div className="text-green-600 text-2xl">✅</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                URL Shortened Successfully! 🎉
              </h3>
              
              <div className="space-y-4">
                {/* Short URL */}
                <div>
                  <label className="block text-sm font-medium text-green-800 mb-1">
                    Short URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={result.shortUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-md text-green-900 font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(result.shortUrl)}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                    >
                      📋
                    </button>
                  </div>
                </div>

                {/* Original URL */}
                <div>
                  <label className="block text-sm font-medium text-green-800 mb-1">
                    Original URL
                  </label>
                  <p className="text-sm text-green-700 bg-white p-2 rounded border border-green-200 break-all">
                    {result.originalUrl}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-green-700">
                  <span>Short Code: <code className="font-mono bg-white px-1 rounded">{result.shortCode}</code></span>
                  <span>Clicks: <strong>{result.clickCount || 0}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
