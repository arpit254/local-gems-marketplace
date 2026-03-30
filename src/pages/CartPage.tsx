import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { saveCheckoutSession } from '@/lib/checkout';
import { useCart } from '@/lib/cart-context';

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const { isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();

  const vendorGroups = items.reduce((acc, item) => {
    const vendorName = item.vendorProduct.vendor.name;
    if (!acc[vendorName]) {
      acc[vendorName] = [];
    }
    acc[vendorName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please log in before placing your order.');
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    saveCheckoutSession({
      createdAt: new Date().toISOString(),
      customerName: profile?.name ?? 'Guest Customer',
      items,
      totalAmount: totalPrice,
    });

    navigate('/payment', {
      state: {
        items,
        totalAmount: totalPrice,
      },
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <span className="mb-4 text-6xl">Cart</span>
        <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Your cart is empty</h1>
        <p className="mb-6 text-muted-foreground">Start adding products from local vendors</p>
        <Button asChild className="gradient-hero border-none text-primary-foreground">
          <Link to="/search">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-bold text-foreground">
          <ShoppingBag className="h-6 w-6 text-primary" /> Your Cart
        </h1>

        <div className="space-y-6">
          {Object.entries(vendorGroups).map(([vendorName, vendorItems]) => (
            <div key={vendorName} className="overflow-hidden rounded-xl border bg-card shadow-card">
              <div className="border-b bg-muted px-4 py-3">
                <h3 className="font-display text-sm font-semibold text-foreground">{vendorName}</h3>
              </div>
              <div className="divide-y">
                {vendorItems.map((item) => (
                  <div key={item.vendorProduct.id} className="flex items-center gap-4 p-4">
                    <span className="text-3xl">{item.vendorProduct.product.image}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.vendorProduct.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Rs {item.vendorProduct.price} {item.vendorProduct.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.vendorProduct.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.vendorProduct.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="w-16 text-right font-display font-bold text-foreground">
                      Rs {item.vendorProduct.price * item.quantity}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeItem(item.vendorProduct.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-lg font-display font-bold text-foreground">Rs {totalPrice}</span>
          </div>
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span className="font-medium text-accent-foreground">Free</span>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-lg font-display font-bold text-foreground">Total</span>
            <span className="text-xl font-display font-bold text-foreground">Rs {totalPrice}</span>
          </div>
          <Button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="mt-4 h-12 w-full border-none text-base font-semibold gradient-hero text-primary-foreground"
          >
            Continue To Payment <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
