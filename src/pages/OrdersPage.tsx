import { Package } from 'lucide-react';
import { toast } from 'sonner';
import OrderCard from '@/components/OrderCard';
import { useMarketplaceData, useUpdateOrderStatus } from '@/hooks/use-marketplace';

function getCancelOrderErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    if (error.message.includes('invalid input value for enum order_status') || error.message.includes('cancelled')) {
      return 'Unable to cancel order. Run the latest order cancellation SQL and try again.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Could not cancel the order.';
}

export default function OrdersPage() {
  const { data, isLoading } = useMarketplaceData();
  const updateOrderStatus = useUpdateOrderStatus();
  const orders = data?.orders ?? [];

  const handleCancelOrder = async (orderId: string) => {
    try {
      await updateOrderStatus.mutateAsync({ orderId, status: 'cancelled' });
      toast.success('Order cancelled successfully.');
    } catch (error) {
      console.error('[orders] Failed to cancel order', error);
      toast.error(getCancelOrderErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" /> My Orders
        </h1>

        {isLoading ? (
          <div className="text-center py-20">
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">Loading your orders...</h2>
            <p className="text-muted-foreground">Syncing order history from Supabase.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">Orders</span>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground">Your order history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                isCancelling={updateOrderStatus.isPending}
                onCancel={(nextOrderId) => void handleCancelOrder(nextOrderId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
