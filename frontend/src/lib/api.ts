import axios from 'axios';
import { CreateUrlRequest, ShortenedUrl, UrlAnalytics, ApiResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance with enhanced configuration
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 429) {
      // Handle rate limiting
      throw new Error('Too many requests. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export const urlApi = {
  // Create short URL
  createUrl: async (data: CreateUrlRequest): Promise<ShortenedUrl> => {
    const response = await api.post<ApiResponse<ShortenedUrl>>('/api/v1/urls', data);
    return response.data.data;
  },

  // Get URL analytics
  getAnalytics: async (shortCode: string): Promise<UrlAnalytics> => {
    const response = await api.get<ApiResponse<UrlAnalytics>>(`/api/v1/urls/${shortCode}/analytics`);
    return response.data.data;
  },

  // Get all user URLs
  getUserUrls: async (page = 1, limit = 10): Promise<{ urls: ShortenedUrl[], total: number }> => {
    const response = await api.get<ApiResponse<{ urls: ShortenedUrl[], total: number }>>(
      `/api/v1/urls?page=${page}&limit=${limit}`
    );
    return response.data.data;
  },

  // Update URL
  updateUrl: async (shortCode: string, data: Partial<CreateUrlRequest>): Promise<ShortenedUrl> => {
    const response = await api.put<ApiResponse<ShortenedUrl>>(`/api/v1/urls/${shortCode}`, data);
    return response.data.data;
  },

  // Delete URL
  deleteUrl: async (shortCode: string): Promise<void> => {
    await api.delete(`/api/v1/urls/${shortCode}`);
  },

  // Health check
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await api.get('/health');
      return response.data.success;
    } catch {
      return false;
    }
  },

  // Bulk operations
  bulkCreateUrls: async (urls: string[]): Promise<ShortenedUrl[]> => {
    const response = await api.post<ApiResponse<ShortenedUrl[]>>('/api/v1/urls/bulk', { urls });
    return response.data.data;
  },
};

export default api;
