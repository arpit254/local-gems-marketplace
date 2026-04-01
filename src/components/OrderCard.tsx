import { CheckCircle, Clock, MapPin, Package, Phone, Truck, Wallet, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Order, OrderStatus } from '@/lib/mock-data';

const statusSteps: { key: OrderStatus; label: string; icon: typeof CheckCircle }[] = [
  { key: 'placed', label: 'Placed', icon: Package },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle },
  { key: 'out_for_delivery', label: 'On the way', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const stepIndex: Record<string, number> = {
  to_be_confirmed: -1,
  placed: 0,
  accepted: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
};

const paymentStatusLabels: Record<string, string> = {
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
  const currentStep = stepIndex[order.status] ?? -1;
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const canCancel = order.status === 'placed' || order.status === 'to_be_confirmed';

  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-display font-bold text-foreground">#{order.id.slice(0, 8)}</p>
          <p className="text-xs text-muted-foreground">{order.vendorName}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isDelivered
              ? 'bg-accent text-accent-foreground'
              : isCancelled
                ? 'bg-destructive/10 text-destructive'
                : 'bg-secondary/10 text-secondary'
          }`}
        >
          {isCancelled ? 'Cancelled' : isDelivered ? 'Delivered' : order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Timeline tracker */}
      {!isCancelled && (
        <div className="mb-5">
          <div className="flex items-center gap-0">
            {statusSteps.map((step, idx) => {
              const isCompleted = currentStep >= idx;
              const isCurrent = currentStep === idx;
              const StepIcon = step.icon;
              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                        isCompleted
                          ? 'gradient-hero text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      } ${isCurrent ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-card' : ''}`}
                    >
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < statusSteps.length - 1 && (
                    <div className={`mx-1 h-0.5 flex-1 rounded-full transition-all ${currentStep > idx ? 'gradient-hero' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled state */}
      {isCancelled && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/5 px-3 py-2">
          <XCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">This order was cancelled</span>
        </div>
      )}

      {/* Items */}
      <div className="mb-3 space-y-1">
        {order.items.map((item, index) => (
          <p key={`${order.id}-${index}`} className="text-sm text-muted-foreground">
            {item.vendorProduct.product.image} {item.vendorProduct.product.name} × {item.quantity}
          </p>
        ))}
      </div>

      {/* Delivery info */}
      {(order.deliveryAddress || order.phoneNumber) && (
        <div className="mb-3 space-y-1 rounded-lg bg-muted/30 px-3 py-2">
          {order.deliveryAddress && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" /> {order.deliveryAddress}
            </p>
          )}
          {order.phoneNumber && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 flex-shrink-0" /> {order.phoneNumber}
            </p>
          )}
        </div>
      )}

      {/* Payment info */}
      <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Wallet className="h-3 w-3" />
          {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
        </span>
        <span className="font-medium text-foreground">{paymentStatusLabels[order.paymentStatus]}</span>
      </div>

      {/* Footer */}
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
        <span className="font-display font-bold text-foreground">₹{order.total}</span>
      </div>
    </div>
  );
}
