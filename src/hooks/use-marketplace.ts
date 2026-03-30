import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrder, fetchMarketplaceData, getFallbackMarketplaceData } from '@/lib/marketplace';

export const MARKETPLACE_QUERY_KEY = ['marketplace-data'];

export function useMarketplaceData() {
  return useQuery({
    queryFn: async () => {
      try {
        const data = await fetchMarketplaceData();
        if (
          data.categories.length === 0 ||
          data.products.length === 0 ||
          data.vendors.length === 0 ||
          data.vendorProducts.length === 0
        ) {
          return {
            ...getFallbackMarketplaceData(),
            isFallback: true,
          };
        }
        return {
          ...data,
          isFallback: false,
        };
      } catch (error) {
        console.warn('Falling back to local marketplace data because Supabase is unavailable.', error);
        return {
          ...getFallbackMarketplaceData(),
          isFallback: true,
        };
      }
    },
    queryKey: MARKETPLACE_QUERY_KEY,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEY });
    },
  });
}
