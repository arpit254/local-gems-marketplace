import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCheckoutOrders,
  createOrder,
  createVendorProduct,
  deleteVendorProduct,
  fetchMarketplaceData,
  getFallbackMarketplaceData,
  recreateVendorProfile,
  updateOrderStatus,
  updateVendorProduct,
} from '@/lib/marketplace';
import type { OrderStatus } from '@/lib/mock-data';

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

export function useSubmitCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCheckoutOrders,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEY });
    },
  });
}

export function useRecreateVendorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, name }: { userId: string; name: string }) =>
      recreateVendorProfile({ userId, name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEY });
    },
  });
}

export function useCreateVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVendorProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEY });
    },
  });
}

export function useUpdateVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVendorProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEY });
    },
  });
}

export function useDeleteVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, vendorProductId }: { productId: string; vendorProductId: string }) =>
      deleteVendorProduct(vendorProductId, productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEY });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus({ orderId, status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEY });
    },
  });
}
