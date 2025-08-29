'use client';

import { useHealthCheck } from '@/hooks/useUrls';
import { Activity, Zap } from 'lucide-react';

export default function Header() {
  const { data: isHealthy } = useHealthCheck();

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-yellow-300" />
            <div>
              <h1 className="text-xl font-bold">QuickLink</h1>
              <p className="text-xs text-blue-100">Lightning Fast URLs</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <Activity className="h-4 w-4" />
              <span>API Status:</span>
              <span className={`font-medium ${isHealthy ? 'text-green-300' : 'text-red-300'}`}>
                {isHealthy ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
