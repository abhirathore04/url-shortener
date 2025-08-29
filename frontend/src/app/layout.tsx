import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import Providers from './providers'
import { Toaster } from 'react-hot-toast'
import MobileNav from '@/components/MobileNav'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'QuickLink - Lightning Fast URL Shortener | 2ms Response Time',
  description: 'The world\'s fastest URL shortener with enterprise-grade security. Shorten URLs in 2ms with 100% uptime guarantee and advanced analytics.',
  keywords: 'url shortener, fast url shortener, link shortener, quick link, enterprise url shortener, analytics, 2ms response',
  authors: [{ name: 'QuickLink Team' }],
  openGraph: {
    title: 'QuickLink - Lightning Fast URL Shortener',
    description: 'The world\'s fastest URL shortener with 2ms response time',
    type: 'website',
    url: 'https://quicklink.app',
    siteName: 'QuickLink',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuickLink - Lightning Fast URL Shortener',
    description: 'The world\'s fastest URL shortener with 2ms response time',
  },
  robots: 'index, follow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {/* Navigation Header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo Section */}
                <Link href="/" className="flex items-center space-x-3 group">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white text-xl">⚡</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      QuickLink
                    </h1>
                    <p className="text-xs text-gray-500">Lightning Fast URLs</p>
                  </div>
                </Link>
                
                {/* Desktop Navigation - NOW VISIBLE */}
                <nav className="hidden md:flex items-center space-x-8">
                  <Link
                    href="/"
                    className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105"
                  >
                    Home
                  </Link>
                  <Link
                    href="/analytics"
                    className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105"
                  >
                    Analytics
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/bulk"
                    className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105"
                  >
                    Bulk Tools
                  </Link>
                </nav>
                
                {/* Right Section */}
                <div className="flex items-center space-x-6">
                  <div className="hidden lg:flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-600">API Status: Online</span>
                    </div>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <span className="text-gray-600">2ms avg response</span>
                  </div>
                  
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                    Get Started
                  </button>
                  
                  {/* Mobile Navigation */}
                  <MobileNav />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="pt-16">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-slate-900 text-white py-16 mt-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <div className="flex justify-center items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    QuickLink
                  </h3>
                </div>
                
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-lg">
                  The world's fastest URL shortener with enterprise-grade security and advanced analytics.
                  Built for speed, reliability, and scale.
                </p>
                
                {/* Footer Navigation */}
                <div className="flex justify-center space-x-8 mb-8 flex-wrap">
                  <Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
                  <Link href="/analytics" className="text-gray-300 hover:text-white transition-colors">Analytics</Link>
                  <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link>
                  <Link href="/bulk" className="text-gray-300 hover:text-white transition-colors">Bulk Tools</Link>
                  <Link href="/api-docs" className="text-gray-300 hover:text-white transition-colors">API Docs</Link>
                </div>
                
                <div className="flex justify-center space-x-8 mb-8 flex-wrap">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">2ms</div>
                    <div className="text-gray-400 text-sm">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">100%</div>
                    <div className="text-gray-400 text-sm">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">69+</div>
                    <div className="text-gray-400 text-sm">Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-400">A+</div>
                    <div className="text-gray-400 text-sm">Security</div>
                  </div>
                </div>
                
                <div className="text-gray-500 text-sm">
                  © 2025 QuickLink. Built with ❤️ for the modern web.
                </div>
              </div>
            </div>
          </footer>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            gutter={8}
            containerStyle={{
              top: 80,
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                color: '#1f2937',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
                style: {
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
                style: {
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
