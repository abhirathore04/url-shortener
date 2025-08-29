'use client';

import { useState } from 'react';
import { useAnalytics } from '@/hooks/useUrls';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, MousePointer, Calendar, ExternalLink } from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';

export default function Analytics() {
  const [shortCode, setShortCode] = useState('');
  const { data: analytics, isLoading, error } = useAnalytics(shortCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.shortCode as HTMLInputElement;
    setShortCode(input.value.trim());
  };

  // Mock data for chart (you can enhance this with real analytics data)
  const chartData = [
    { name: 'Mon', clicks: 12 },
    { name: 'Tue', clicks: 19 },
    { name: 'Wed', clicks: 8 },
    { name: 'Thu', clicks: 25 },
    { name: 'Fri', clicks: 22 },
    { name: 'Sat', clicks: 15 },
    { name: 'Sun', clicks: 11 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">URL Analytics</h2>
        
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            name="shortCode"
            type="text"
            placeholder="Enter short code (e.g., abc123)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Get Analytics
          </button>
        </form>
      </div>

      {/* Analytics Results */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="text-red-600">⚠️</div>
            <div>
              <h3 className="text-red-900 font-semibold">Analytics Error</h3>
              <p className="text-red-700">
                {(error as any)?.response?.data?.message || 'Failed to load analytics'}
              </p>
            </div>
          </div>
        </div>
      )}

      {analytics && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Clicks</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(analytics.clickCount)}</p>
                </div>
                <MousePointer className="h-12 w-12 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Created</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(analytics.createdAt)}</p>
                </div>
                <Calendar className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Last Click</p>
                  <p className="text-lg font-bold text-gray-900">
                    {analytics.lastAccessed ? formatDate(analytics.lastAccessed) : 'Never'}
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-600" />
              </div>
            </div>
          </div>

          {/* URL Details */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">URL Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Short Code</label>
                <code className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">{analytics.shortCode}</code>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Original URL</label>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-900 break-all flex-1">{analytics.originalUrl}</p>
                  <a
                    href={analytics.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Click Trends (Last 7 Days)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="clicks" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
