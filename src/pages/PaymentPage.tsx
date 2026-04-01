import { CreditCard, Loader2, Smartphone, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitCheckout } from '@/hooks/use-marketplace';
import { clearCheckoutSession, getCheckoutSession, simulateMockPayment } from '@/lib/checkout';
import { useCart } from '@/lib/cart-context';
import type { PaymentMethod } from '@/lib/mock-data';

function getCheckoutErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    if (
      error.message.includes('delivery_address') ||
      error.message.includes('delivery_landmark') ||
      error.message.includes('delivery_instructions') ||
      error.message.includes('phone_number')
    ) {
      return 'Unable to place order. Run the latest order delivery details SQL and try again.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Could not create your order. Please try again.';
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const submitCheckout = useSubmitCheckout();
  const { clearCart } = useCart();
  const checkout = useMemo(() => getCheckoutSession(), []);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod');
  const [cardNumber, setCardNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(checkout?.deliveryAddress ?? '');
  const [deliveryInstructions, setDeliveryInstructions] = useState(checkout?.deliveryInstructions ?? '');
  const [deliveryLandmark, setDeliveryLandmark] = useState(checkout?.deliveryLandmark ?? '');
  const [upiId, setUpiId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(checkout?.phoneNumber ?? '');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!checkout || checkout.items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [checkout, navigate]);

  if (!checkout || checkout.items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-card">
          <h1 className="font-display text-2xl font-bold text-foreground">Checkout not ready</h1>
          <p className="mt-3 text-muted-foreground">
            Add products to your cart first, then continue to payment from the cart page.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild className="border-none gradient-hero text-primary-foreground">
              <Link to="/cart">Go to cart</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isSubmitting = isProcessing || submitCheckout.isPending;

  const validateDeliveryDetails = () => {
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter your phone number.');
      return false;
    }

    if (!deliveryAddress.trim()) {
      setErrorMessage('Please enter your delivery address.');
      return false;
    }

    return true;
  };

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
    if (!validateDeliveryDetails()) {
      return;
    }

    const orderIds = await submitCheckout.mutateAsync({
      customerName: checkout.customerName,
      deliveryAddress: deliveryAddress.trim(),
      deliveryInstructions: deliveryInstructions.trim(),
      deliveryLandmark: deliveryLandmark.trim(),
      items: checkout.items,
      paymentMethod,
      paymentStatus,
      phoneNumber: phoneNumber.trim(),
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
      setErrorMessage(getCheckoutErrorMessage(error));
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
      setErrorMessage(getCheckoutErrorMessage(error));
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

            <div className="mt-6 space-y-4 rounded-xl border bg-background p-4">
              <div className="space-y-2">
                <Label htmlFor="phone-number">Phone Number</Label>
                <Input
                  id="phone-number"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="9876543210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery-address">Delivery Address</Label>
                <Textarea
                  id="delivery-address"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  placeholder="House / flat number, street, area, city"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="delivery-landmark">Landmark</Label>
                  <Input
                    id="delivery-landmark"
                    value={deliveryLandmark}
                    onChange={(event) => setDeliveryLandmark(event.target.value)}
                    placeholder="Near metro station"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery-instructions">Delivery Instructions</Label>
                  <Input
                    id="delivery-instructions"
                    value={deliveryInstructions}
                    onChange={(event) => setDeliveryInstructions(event.target.value)}
                    placeholder="Call before arrival"
                  />
                </div>
              </div>
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
                      <Link to={`/vendors/${item.vendorProduct.vendor.id}`} className="hover:text-primary">
                        {item.vendorProduct.vendor.name}
                      </Link>{' '}
                      • Qty {item.quantity}
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
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Deliver To</span>
                <span className="max-w-[16rem] text-right text-foreground">
                  {deliveryAddress.trim() || 'Add your address above'}
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
