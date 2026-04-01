import { CheckCircle, Clock, Package, Truck, Wallet, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Order } from '@/lib/mock-data';

const statusConfig = {
  accepted: { label: 'Accepted', icon: CheckCircle, step: 2 },
  cancelled: { label: 'Cancelled', icon: XCircle, step: 1 },
  delivered: { label: 'Delivered', icon: CheckCircle, step: 4 },
  out_for_delivery: { label: 'Out for Delivery', icon: Truck, step: 3 },
  placed: { label: 'Order Placed', icon: Package, step: 1 },
  rejected: { label: 'Rejected', icon: XCircle, step: 1 },
};

const paymentStatusLabels = {
  failed: 'Payment Failed',
  paid: 'Paid',
  pending: 'Pending',
};

export default function OrderCard({
  isCancelling = false,
  onCancel,
  order,
}: {
  isCancelling?: boolean;
  onCancel?: (orderId: string) => void;
  order: Order;
}) {
  const config = statusConfig[order.status];
  const canCancel = order.status === 'placed' || order.status === 'accepted';

  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-display font-bold text-foreground">#{order.id}</p>
          <p className="text-xs text-muted-foreground">{order.vendorName}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            order.status === 'delivered'
              ? 'bg-accent text-accent-foreground'
              : order.status === 'cancelled' || order.status === 'rejected'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-secondary/10 text-secondary'
          }`}
        >
          {config.label}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className={`h-1.5 flex-1 rounded-full ${step <= config.step ? 'gradient-hero' : 'bg-muted'}`} />
        ))}
      </div>

      <div className="mb-3 space-y-1">
        {order.items.map((item, index) => (
          <p key={`${order.id}-${index}`} className="text-sm text-muted-foreground">
            {item.vendorProduct.product.image} {item.vendorProduct.product.name} x {item.quantity}
          </p>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Wallet className="h-3 w-3" />
          {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
        </span>
        <span className="font-medium text-foreground">{paymentStatusLabels[order.paymentStatus]}</span>
      </div>

      <div className="flex items-center justify-between gap-4 border-t pt-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
          {canCancel && onCancel && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive"
              disabled={isCancelling}
              onClick={() => onCancel(order.id)}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel order'}
            </Button>
          )}
        </div>
        <span className="font-display font-bold text-foreground">Rs {order.total}</span>
      </div>
    </div>
  );
}
