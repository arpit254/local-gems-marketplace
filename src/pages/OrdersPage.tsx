import OrderCard from '@/components/OrderCard';
import { sampleOrders } from '@/lib/mock-data';
import { Package } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" /> My Orders
        </h1>

        {sampleOrders.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">📦</span>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground">Your order history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sampleOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
