import { Package, Clock, CheckCircle, Truck } from 'lucide-react';
import type { Order } from '@/lib/mock-data';

const statusConfig = {
  placed: { label: 'Order Placed', icon: Package, step: 1 },
  accepted: { label: 'Accepted', icon: CheckCircle, step: 2 },
  out_for_delivery: { label: 'Out for Delivery', icon: Truck, step: 3 },
  delivered: { label: 'Delivered', icon: CheckCircle, step: 4 },
};

export default function OrderCard({ order }: { order: Order }) {
  const config = statusConfig[order.status];

  return (
    <div className="bg-card border rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-display font-bold text-foreground">#{order.id}</p>
          <p className="text-xs text-muted-foreground">{order.vendorName}</p>
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
          order.status === 'delivered' ? 'bg-accent text-accent-foreground' : 'bg-secondary/10 text-secondary'
        }`}>
          {config.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4].map(step => (
          <div key={step} className={`flex-1 h-1.5 rounded-full ${step <= config.step ? 'gradient-hero' : 'bg-muted'}`} />
        ))}
      </div>

      <div className="space-y-1 mb-3">
        {order.items.map((item, i) => (
          <p key={i} className="text-sm text-muted-foreground">
            {item.vendorProduct.product.image} {item.vendorProduct.product.name} × {item.quantity}
          </p>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
        <span className="font-display font-bold text-foreground">₹{order.total}</span>
      </div>
    </div>
  );
}
