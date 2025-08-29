import { Metadata } from 'next';
import BulkUrlManager from '@/components/BulkUrlManager';

export const metadata: Metadata = {
  title: 'Bulk URL Tools - QuickLink',
  description: 'Upload and shorten multiple URLs at once with our powerful bulk processing tools.',
};

export default function BulkPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Bulk URL Tools
          </h1>
          <p className="text-gray-600 text-lg">
            Process multiple URLs at once with our enterprise-grade bulk tools
          </p>
        </div>
        
        <BulkUrlManager />
      </div>
    </div>
  );
}
