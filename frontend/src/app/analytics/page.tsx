'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, MapPin, Globe, Users, MousePointer, TrendingUp } from 'lucide-react';
import StatCard from '@/components/StatCard';

// Mock data for charts
const chartData = [
  { name: 'Mon', clicks: 12, visitors: 8 },
  { name: 'Tue', clicks: 19, visitors: 15 },
  { name: 'Wed', clicks: 8, visitors: 6 },
  { name: 'Thu', clicks: 25, visitors: 20 },
  { name: 'Fri', clicks: 22, visitors: 18 },
  { name: 'Sat', clicks: 15, visitors: 12 },
  { name: 'Sun', clicks: 11, visitors: 9 },
];

const pieData = [
  { name: 'Desktop', value: 65, color: '#3B82F6' },
  { name: 'Mobile', value: 30, color: '#8B5CF6' },
  { name: 'Tablet', value: 5, color: '#F59E0B' },
];

export default function AdvancedAnalytics() {
  const [shortCode, setShortCode] = useState('');
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            📊 Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-xl">
            Comprehensive insights and performance metrics for your URLs
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Analyze Specific URL
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                placeholder="Enter short code (e.g., abc123)"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
              />
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                Analyze
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            icon={<MousePointer className="w-6 h-6" />} 
            label="Total Clicks" 
            value="1,247" 
            change="+12%" 
            trend="up"
          />
          <StatCard 
            icon={<Users className="w-6 h-6" />} 
            label="Unique Visitors" 
            value="892" 
            change="+8%" 
            trend="up"
          />
          <StatCard 
            icon={<Globe className="w-6 h-6" />} 
            label="Countries" 
            value="24" 
            change="+3" 
            trend="up"
          />
          <StatCard 
            icon={<Calendar className="w-6 h-6" />} 
            label="This Month" 
            value="5,438" 
            change="+24%" 
            trend="up"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Click Trends Chart */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
              Click Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.95)', 
                    backdropFilter: 'blur(12px)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Device Breakdown Chart */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Globe className="w-6 h-6 mr-3 text-purple-600" />
              Device Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-6 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{entry.name} ({entry.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">98.5%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
              <div className="text-3xl font-bold text-green-600 mb-2">1.8s</div>
              <div className="text-gray-600">Avg Load Time</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">15%</div>
              <div className="text-gray-600">CTR Improvement</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
