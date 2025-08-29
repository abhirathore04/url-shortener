'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="md:hidden text-gray-600 p-2 hover:text-gray-900 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      
      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-white/20 shadow-lg z-50">
          <nav className="px-4 py-6 space-y-4">
            <Link 
              href="/" 
              className="block text-gray-800 hover:text-blue-600 font-medium transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              🏠 Home
            </Link>
            <Link 
              href="/analytics" 
              className="block text-gray-800 hover:text-blue-600 font-medium transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              📊 Analytics
            </Link>
            <Link 
              href="/dashboard" 
              className="block text-gray-800 hover:text-blue-600 font-medium transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              👤 Dashboard
            </Link>
            <Link 
              href="/bulk" 
              className="block text-gray-800 hover:text-blue-600 font-medium transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              📁 Bulk Tools
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
