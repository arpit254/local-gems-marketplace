import { CheckCircle2, Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { PaymentMethod } from '@/lib/mock-data';

type SuccessState = {
  orderCount?: number;
  paymentMethod?: PaymentMethod;
  totalAmount?: number;
};

export default function OrderSuccessPage() {
  const location = useLocation();
  const state = (location.state as SuccessState | null) ?? null;
  const paymentLabel = state?.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment';

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Order placed successfully</h1>
        <p className="mt-3 text-muted-foreground">
          {state?.orderCount
            ? `${state.orderCount} order${state.orderCount === 1 ? '' : 's'} created with ${paymentLabel}.`
            : 'Your checkout is complete and your order is now in progress.'}
        </p>

        {typeof state?.totalAmount === 'number' && (
          <div className="mt-6 rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Payment Method</span>
              <span className="font-medium text-foreground">{paymentLabel}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <span className="font-display text-lg font-bold text-foreground">Total Paid / Due</span>
              <span className="font-display text-xl font-bold text-foreground">Rs {state.totalAmount}</span>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="border-none gradient-hero text-primary-foreground">
            <Link to="/orders">
              <Package className="mr-2 h-4 w-4" />
              View Orders
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/search">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
