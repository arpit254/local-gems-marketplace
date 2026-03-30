import { CreditCard, Loader2, Smartphone, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubmitCheckout } from '@/hooks/use-marketplace';
import { clearCheckoutSession, getCheckoutSession, simulateMockPayment } from '@/lib/checkout';
import { useCart } from '@/lib/cart-context';
import type { PaymentMethod } from '@/lib/mock-data';

export default function PaymentPage() {
  const navigate = useNavigate();
  const submitCheckout = useSubmitCheckout();
  const { clearCart } = useCart();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod');
  const [cardNumber, setCardNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const checkout = useMemo(() => getCheckoutSession(), []);

  useEffect(() => {
    if (!checkout || checkout.items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [checkout, navigate]);

  if (!checkout || checkout.items.length === 0) {
    return null;
  }

  const isSubmitting = isProcessing || submitCheckout.isPending;

  const handleOrderSuccess = (paymentMethod: PaymentMethod, orderIds: string[]) => {
    clearCart();
    clearCheckoutSession();
    toast.success(paymentMethod === 'cod' ? 'Order confirmed with Cash on Delivery.' : 'Payment successful and order placed.');
    navigate('/order-success', {
      replace: true,
      state: {
        orderCount: orderIds.length,
        paymentMethod,
        totalAmount: checkout.totalAmount,
      },
    });
  };

  const createCheckoutOrders = async (paymentMethod: PaymentMethod, paymentStatus: 'pending' | 'paid') => {
    const orderIds = await submitCheckout.mutateAsync({
      customerName: checkout.customerName,
      items: checkout.items,
      paymentMethod,
      paymentStatus,
    });

    handleOrderSuccess(paymentMethod, orderIds);
  };

  const handleConfirmCod = async () => {
    setErrorMessage('');
    setIsProcessing(true);

    try {
      await createCheckoutOrders('cod', 'pending');
    } catch (error) {
      console.error('[checkout] COD order creation failed', error);
      setErrorMessage(error instanceof Error ? error.message : 'Could not create your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOnlinePayment = async (shouldSucceed: boolean) => {
    setErrorMessage('');
    setIsProcessing(true);

    try {
      await simulateMockPayment({ shouldSucceed });
      await createCheckoutOrders('online', 'paid');
    } catch (error) {
      console.error('[checkout] Online payment flow failed', error);
      setErrorMessage(error instanceof Error ? error.message : 'Online payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border bg-card p-6 shadow-card">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Checkout</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Choose how you want to pay</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Orders are created only after payment succeeds online, or immediately when you choose Cash on Delivery.
            </p>

            <div className="mt-6 grid gap-3">
              {[
                {
                  description: 'Pay with a mock card or UPI flow before we create the order.',
                  icon: CreditCard,
                  label: 'Online Payment',
                  value: 'online' as const,
                },
                {
                  description: 'Place the order now and pay the delivery partner when it arrives.',
                  icon: Truck,
                  label: 'Cash on Delivery',
                  value: 'cod' as const,
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSelectedMethod(option.value);
                    setErrorMessage('');
                  }}
                  className={`rounded-xl border p-4 text-left transition ${
                    selectedMethod === option.value
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border bg-background hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-muted p-2">
                      <option.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{option.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedMethod === 'online' && (
              <div className="mt-6 space-y-4 rounded-xl border bg-background p-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    value={cardNumber}
                    onChange={(event) => setCardNumber(event.target.value)}
                    placeholder="4111 1111 1111 1111"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upi-id">UPI ID</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="upi-id"
                      value={upiId}
                      onChange={(event) => setUpiId(event.target.value)}
                      placeholder="name@upi"
                      className="pl-9"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  This is a mock gateway. These fields are placeholders so it stays easy to swap in Stripe, Razorpay, or Paytm later.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {selectedMethod === 'cod' ? (
                <Button
                  onClick={handleConfirmCod}
                  disabled={isSubmitting}
                  className="border-none gradient-hero text-primary-foreground"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Order
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => void handleOnlinePayment(true)}
                    disabled={isSubmitting}
                    className="border-none gradient-hero text-primary-foreground"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pay Now (Success)
                  </Button>
                  <Button
                    onClick={() => void handleOnlinePayment(false)}
                    disabled={isSubmitting}
                    variant="outline"
                  >
                    Simulate Failure
                  </Button>
                </>
              )}

              <Button asChild variant="ghost" disabled={isSubmitting}>
                <Link to="/cart">Back To Cart</Link>
              </Button>
            </div>
          </section>

          <aside className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="font-display text-xl font-bold text-foreground">Order Summary</h2>
            <div className="mt-4 space-y-3">
              {checkout.items.map((item) => (
                <div key={item.vendorProduct.id} className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <p className="font-medium text-foreground">
                      {item.vendorProduct.product.image} {item.vendorProduct.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.vendorProduct.vendor.name} • Qty {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">Rs {item.vendorProduct.price * item.quantity}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="text-foreground">{checkout.items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize text-foreground">
                  {selectedMethod === 'cod' ? 'Cash on Delivery' : 'Online'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-display text-lg font-bold text-foreground">Total</span>
                <span className="font-display text-xl font-bold text-foreground">Rs {checkout.totalAmount}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
