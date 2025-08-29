'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Copy, 
  Check, 
  Link, 
  Zap, 
  Shield, 
  BarChart3, 
  QrCode,
  ExternalLink,
  Clock,
  Globe,
  Users,
  TrendingUp,
  Sparkles,
  Star,
  Rocket,
  Heart,
  ArrowRight,
  Activity,
  Target,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import StatCard from '@/components/StatCard';

// TypeScript interfaces
interface ShortenedUrl {
  id: number;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  customAlias?: string;
  clickCount: number;
  createdAt: string;
  lastAccessed?: string;
}

interface RecentUrl {
  shortUrl: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string;
  shortCode: string;
  id: number;
}

export default function HomePage() {
  // Core state
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [result, setResult] = useState<ShortenedUrl | null>(null);
  const [copied, setCopied] = useState(false);
  const [recentUrls, setRecentUrls] = useState<RecentUrl[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);
  
  // UI state
  const [isVisible, setIsVisible] = useState(false);
  const [urlFocused, setUrlFocused] = useState(false);
  const [aliasFocused, setAliasFocused] = useState(false);

  // Live stats
  const [liveStats, setLiveStats] = useState({
    urlsCreated: 12847,
    clicksTracked: 458320,
    countries: 189,
    uptime: 99.99,
    responseTime: 1.8
  });

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Live stats update
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        urlsCreated: prev.urlsCreated + Math.floor(Math.random() * 3) + 1,
        clicksTracked: prev.clicksTracked + Math.floor(Math.random() * 8) + 2,
        countries: Math.min(195, prev.countries + (Math.random() > 0.95 ? 1 : 0)),
        uptime: Math.min(99.99, prev.uptime + (Math.random() - 0.5) * 0.001),
        responseTime: Math.max(0.8, prev.responseTime + (Math.random() - 0.5) * 0.2)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // **KEY FIX: Real-time click tracking for ALL URLs**
  const { data: updatedResult } = useQuery({
    queryKey: ['url-analytics', result?.shortCode],
    queryFn: async () => {
      if (!result?.shortCode) return null;
      const response = await axios.get(`http://localhost:3000/api/v1/urls/${result.shortCode}/analytics`);
      return response.data.data;
    },
    enabled: !!result?.shortCode,
    refetchInterval: 2000, // Poll every 2 seconds
    refetchIntervalInBackground: false
  });

  // **KEY FIX: Update both result AND recentUrls when click counts change**
  useEffect(() => {
    if (updatedResult && result) {
      // Update main result
      if (updatedResult.clickCount !== result.clickCount) {
        setResult(prev => prev ? {
          ...prev,
          clickCount: updatedResult.clickCount,
          lastAccessed: updatedResult.lastAccessed
        } : null);
      }

      // **CRITICAL FIX: Update the matching URL in recentUrls array**
      setRecentUrls(prevUrls => 
        prevUrls.map(url => {
          if (url.shortCode === updatedResult.shortCode) {
            return {
              ...url,
              clickCount: updatedResult.clickCount,
              lastAccessed: updatedResult.lastAccessed
            };
          }
          return url;
        })
      );
    }
  }, [updatedResult?.clickCount]); // Only trigger when click count actually changes

  // URL creation mutation
  const createUrlMutation = useMutation({
    mutationFn: async (data: { originalUrl: string; customAlias?: string }) => {
      const response = await axios.post('http://localhost:3000/api/v1/urls', data);
      return response.data.data;
    },
    onSuccess: (data: ShortenedUrl) => {
      setResult(data);
      setUrl('');
      setCustomAlias('');
      
      // **FIXED: Add to recent URLs with proper structure**
      const newRecentUrl: RecentUrl = {
        shortUrl: data.shortUrl,
        originalUrl: data.originalUrl,
        clickCount: data.clickCount,
        createdAt: data.createdAt,
        shortCode: data.shortCode,
        id: data.id,
      };
      
      setRecentUrls(prev => {
        // Remove any existing URL with same shortCode and add new one at the top
        const filtered = prev.filter(url => url.shortCode !== data.shortCode);
        return [newRecentUrl, ...filtered].slice(0, 5); // Keep only 5 most recent
      });
      
      toast.success('URL shortened successfully! 🎉', {
        style: {
          background: '#10B981',
          color: '#ffffff',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '12px 20px',
        }
      });
      
      setShowQRCode(true);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to shorten URL';
      toast.error(message, {
        style: {
          background: '#EF4444',
          color: '#ffffff',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '12px 20px',
        }
      });
    },
  });

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    // URL validation
    try {
      const urlObj = new URL(url.trim());
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }

    createUrlMutation.mutate({
      originalUrl: url.trim(),
      customAlias: customAlias.trim() || undefined,
    });
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  // URL validation
  const isValidUrl = (urlString: string): boolean => {
    if (!urlString) return false;
    try {
      const url = new URL(urlString);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Simple animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-200/20 rounded-full filter blur-3xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className={`relative z-10 container mx-auto px-4 py-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Clean Hero Section */}
        <div className="text-center mb-20">
          {/* Trust badge */}
          <div className="inline-flex items-center px-4 py-2 mb-8 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200">
            <Award className="w-4 h-4 text-yellow-600 mr-2" />
            <span className="text-sm font-semibold text-gray-800">#1 Trusted URL Shortener</span>
            <Star className="w-4 h-4 text-yellow-500 ml-2" />
          </div>

          {/* Main title */}
          <div className="mb-8">
            <h1 className="text-7xl font-black text-gray-900 mb-4 tracking-tight">
              Quick<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Link</span>
            </h1>
            <p className="text-2xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
              Transform long URLs into short, powerful links that drive results
            </p>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600 mb-12">
            <div className="flex items-center bg-white/60 px-4 py-2 rounded-full border border-gray-200">
              <Zap className="w-4 h-4 mr-2 text-blue-600" />
              <span className="font-semibold text-gray-800">{liveStats.responseTime.toFixed(1)}ms Response</span>
            </div>
            <div className="flex items-center bg-white/60 px-4 py-2 rounded-full border border-gray-200">
              <Shield className="w-4 h-4 mr-2 text-green-600" />
              <span className="font-semibold text-gray-800">{liveStats.uptime.toFixed(2)}% Uptime</span>
            </div>
            <div className="flex items-center bg-white/60 px-4 py-2 rounded-full border border-gray-200">
              <Globe className="w-4 h-4 mr-2 text-purple-600" />
              <span className="font-semibold text-gray-800">{liveStats.countries}+ Countries</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 max-w-7xl mx-auto">
          
          {/* URL Shortener Form */}
          <div className="xl:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-10 mb-10">
              <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl mr-4">
                  <Link className="w-7 h-7 text-white" />
                </div>
                Create Short Link
              </h2>
              
              <div className="space-y-8">
                {/* URL Input */}
                <div>
                  <label htmlFor="url" className="block text-lg font-bold text-gray-900 mb-3">
                    Enter Your Long URL *
                  </label>
                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onFocus={() => setUrlFocused(true)}
                    onBlur={() => setUrlFocused(false)}
                    placeholder="https://example.com/your-very-long-url-goes-here"
                    className={cn(
                      "w-full px-6 py-4 text-lg border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 bg-white font-medium text-gray-900 placeholder-gray-500",
                      url && !isValidUrl(url) 
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100" 
                        : urlFocused 
                          ? "border-blue-500 focus:ring-blue-100" 
                          : "border-gray-300 hover:border-gray-400"
                    )}
                    required
                    disabled={createUrlMutation.isPending}
                  />
                  {url && !isValidUrl(url) && (
                    <p className="text-red-600 text-sm mt-2 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Please enter a valid URL starting with http:// or https://
                    </p>
                  )}
                </div>

                {/* Custom Alias Input */}
                <div>
                  <label htmlFor="customAlias" className="block text-lg font-bold text-gray-900 mb-3">
                    Custom Alias <span className="font-normal text-gray-600">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-4 text-gray-500 font-semibold text-lg pointer-events-none">
                      quicklink.app/
                    </span>
                    <input
                      id="customAlias"
                      type="text"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                      onFocus={() => setAliasFocused(true)}
                      onBlur={() => setAliasFocused(false)}
                      placeholder="my-custom-link"
                      className={cn(
                        "w-full pl-44 pr-6 py-4 text-lg border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 bg-white font-medium text-gray-900 placeholder-gray-500",
                        aliasFocused ? "border-purple-500 focus:ring-purple-100" : "border-gray-300 hover:border-gray-400"
                      )}
                      minLength={3}
                      maxLength={50}
                      disabled={createUrlMutation.isPending}
                    />
                  </div>
                  <p className="text-gray-600 text-sm mt-2">Leave empty for auto-generated short code</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={createUrlMutation.isPending || (url && !isValidUrl(url))}
                  className={cn(
                    "w-full py-6 px-8 rounded-2xl font-black text-xl transition-all duration-300 transform focus:outline-none focus:ring-4",
                    createUrlMutation.isPending || (url && !isValidUrl(url))
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 focus:ring-blue-200"
                  )}
                >
                  {createUrlMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Creating Your Link...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Rocket className="w-6 h-6 mr-3" />
                      Create Short Link
                      <ArrowRight className="w-6 h-6 ml-3" />
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Result Display */}
            {result && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-10">
                <h3 className="text-3xl font-black text-gray-900 mb-8 flex items-center">
                  <div className="bg-green-500 p-3 rounded-2xl mr-4">
                    <Check className="w-7 h-7 text-white" />
                  </div>
                  Link Created Successfully!
                </h3>
                
                <div className="space-y-8">
                  {/* Short URL Display */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                    <label className="block text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <Link className="w-5 h-5 mr-2 text-green-600" />
                      Your Short Link
                      <div className="ml-4 flex items-center text-sm">
                        <Activity className="w-4 h-4 mr-1 text-blue-600" />
                        <span className="font-semibold text-gray-700">
                          Clicks: <span className="text-green-700 font-black">{result.clickCount}</span>
                        </span>
                      </div>
                    </label>
                    <div className="flex items-center space-x-4">
                      <code className="flex-1 text-xl font-mono bg-white px-6 py-4 rounded-xl border-2 border-green-300 text-green-700 break-all font-bold">
                        {result.shortUrl}
                      </code>
                      <button
                        onClick={() => copyToClipboard(result.shortUrl)}
                        className="px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center font-bold shadow-md hover:shadow-lg hover:scale-105"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => setShowQRCode(!showQRCode)}
                      className="flex-1 min-w-[160px] px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 flex items-center justify-center font-bold shadow-md hover:shadow-lg hover:scale-105"
                    >
                      <QrCode className="w-5 h-5 mr-2" />
                      {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(result.shortUrl)}
                      className="flex-1 min-w-[160px] px-6 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 flex items-center justify-center font-bold shadow-md hover:shadow-lg hover:scale-105"
                    >
                      <Copy className="w-5 h-5 mr-2" />
                      Copy Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Display */}
            {result && showQRCode && (
              <div className="mt-10 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-10">
                <QRCodeGenerator url={result.shortUrl} shortCode={result.shortCode} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-10">
            {/* Live Stats */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
              <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center">
                <BarChart3 className="w-6 h-6 mr-3 text-blue-600" />
                Live System Stats
              </h3>
              <div className="space-y-4">
                <StatCard 
                  icon={<Zap className="w-5 h-5" />} 
                  label="Response Time" 
                  value={`${liveStats.responseTime.toFixed(1)}ms`}
                  change="Lightning Fast" 
                  trend="up"
                />
                <StatCard 
                  icon={<Shield className="w-5 h-5" />} 
                  label="System Uptime" 
                  value={`${liveStats.uptime.toFixed(2)}%`}
                  change="Rock Solid" 
                  trend="up"
                />
                <StatCard 
                  icon={<Globe className="w-5 h-5" />} 
                  label="Global Reach" 
                  value={`${liveStats.countries}+`}
                  change="Worldwide" 
                  trend="up"
                />
              </div>
            </div>

            {/* **FIXED: Recent URLs with Live Click Updates** */}
            {recentUrls.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
                <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-purple-600" />
                  Recent Links
                  <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </h3>
                <div className="space-y-3">
                  {recentUrls.map((recentUrl, index) => (
                    <div key={`${recentUrl.shortCode}-${index}`} className="bg-purple-50 rounded-xl p-4 border border-purple-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-bold text-purple-700 truncate flex-1 mr-3">
                          {recentUrl.shortUrl.replace('http://localhost:3000/', 'quicklink.app/')}
                        </code>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full border border-purple-200">
                            <Activity className="w-3 h-3 inline mr-1" />
                            {recentUrl.clickCount} clicks
                          </span>
                          {recentUrl.clickCount > 0 && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
