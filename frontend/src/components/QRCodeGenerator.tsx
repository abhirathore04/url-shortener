'use client';

import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, ExternalLink, Settings, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

interface QRCodeGeneratorProps {
  url: string;
  shortCode: string;
}

export default function QRCodeGenerator({ url, shortCode }: QRCodeGeneratorProps) {
  const [qrSize, setQrSize] = useState(256);
  const [includeMargin, setIncludeMargin] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // **KEY FIX: Ensure URL has proper protocol**
  const normalizeUrl = (inputUrl: string): string => {
    // Remove any whitespace
    const cleanUrl = inputUrl.trim();
    
    // If URL doesn't start with http:// or https://, add https://
    if (!cleanUrl.match(/^https?:\/\//i)) {
      return `https://${cleanUrl}`;
    }
    
    return cleanUrl;
  };

  // **CRITICAL: Use normalized URL for QR code**
  const qrCodeUrl = normalizeUrl(url);

  // Test the URL before generating QR code
  const testUrl = async () => {
    try {
      new URL(qrCodeUrl); // Validate URL format
      window.open(qrCodeUrl, '_blank', 'noopener,noreferrer');
      toast.success('URL is valid and working! 🎉');
    } catch (error) {
      toast.error('Invalid URL format detected!');
      console.error('URL validation error:', error);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    if (canvas) {
      // **FIX: Ensure high quality download**
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `quicklink-${shortCode}-qr.png`;
      link.href = dataUrl;
      link.click();
      toast.success('QR Code downloaded! 📱');
    }
  };

  const copyQRToClipboard = async () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          toast.success('QR Code copied to clipboard! 📋');
        }
      }, 'image/png', 1.0); // High quality
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 text-center">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-center">
        <QrCode className="w-6 h-6 mr-2 text-purple-600" />
        QR Code Scanner
      </h3>
      
      {/* **ENHANCED: Display the URL being encoded** */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-2">Encoded URL:</p>
        <code className="text-sm text-purple-700 break-all font-mono bg-white px-3 py-2 rounded border">
          {qrCodeUrl}
        </code>
        <button
          onClick={testUrl}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto text-sm font-semibold"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Test URL
        </button>
      </div>

      {/* **CRITICAL FIX: QR Code with proper imageSettings** */}
      <div className="mb-6 flex justify-center">
        <div className="bg-white p-1 rounded-2xl border-1 border-gray-300 shadow-inner">
          <QRCodeCanvas
            id="qr-code"
            value={qrCodeUrl} // Use normalized URL
            size={qrSize}
            level="M" // Medium error correction for better scanning
            includeMargin={includeMargin}
            marginSize={4} // Ensure proper quiet zone
            bgColor="#FFFFFF" // Pure white background
            fgColor="#000000" // Pure black foreground for maximum contrast
            // **KEY FIX: Remove imageSettings or set src to undefined/null**
            imageSettings={{
              src: undefined, // This fixes the empty string error
              height: 0,
              width: 0,
              excavate: false,
            }}
          />
        </div>
      </div>

      <p className="text-gray-600 mb-6 font-medium">
        Scan this QR code with any camera app or Google Lens to access your shortened URL
      </p>

      {/* QR Code Settings */}
      <div className="mb-6">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center mx-auto font-semibold"
        >
          <Settings className="w-4 h-4 mr-2" />
          {showSettings ? 'Hide Settings' : 'Show Settings'}
        </button>
        
        {showSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  QR Code Size: {qrSize}px
                </label>
                <input
                  type="range"
                  min="128"
                  max="512"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeMargin"
                  checked={includeMargin}
                  onChange={(e) => setIncludeMargin(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="includeMargin" className="text-sm font-semibold text-gray-700">
                  Include Quiet Zone (Recommended for scanning)
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={downloadQR}
          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center font-bold shadow-md hover:shadow-lg hover:scale-105"
        >
          <Download className="w-5 h-5 mr-2" />
          Download
        </button>
        <button
          onClick={copyQRToClipboard}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 flex items-center font-bold shadow-md hover:shadow-lg hover:scale-105"
        >
          <Copy className="w-5 h-5 mr-2" />
          Copy Image
        </button>
      </div>

      {/* **NEW: Scanning Tips** */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="font-bold text-blue-900 mb-2">📱 Scanning Tips:</h4>
        <ul className="text-sm text-blue-800 text-left space-y-1">
          <li>• Hold your phone 6-12 inches from the QR code</li>
          <li>• Ensure good lighting and avoid glare</li>
          <li>• Keep the camera steady until it focuses</li>
          <li>• Tap the notification/link that appears after scanning</li>
        </ul>
      </div>
    </div>
  );
}
