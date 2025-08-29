import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { urlApi } from '@/lib/api';
import { CreateUrlRequest } from '@/lib/types';
import toast from 'react-hot-toast';

export function useCreateUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: urlApi.createUrl,
    onSuccess: (data) => {
      toast.success(`URL shortened successfully! 🎉`);
      queryClient.invalidateQueries({ queryKey: ['urls'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create short URL';
      toast.error(message);
    },
  });
}

export function useAnalytics(shortCode: string) {
  return useQuery({
    queryKey: ['analytics', shortCode],
    queryFn: () => urlApi.getAnalytics(shortCode),
    enabled: !!shortCode,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
}

export function useDeleteUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: urlApi.deleteUrl,
    onSuccess: () => {
      toast.success('URL deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['urls'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete URL';
      toast.error(message);
    },
  });
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: urlApi.healthCheck,
    refetchInterval: 60000, // Check every minute
    retry: 3,
  });
}
