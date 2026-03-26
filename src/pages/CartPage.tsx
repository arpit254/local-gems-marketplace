import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();

  const vendorGroups = items.reduce((acc, item) => {
    const vName = item.vendorProduct.vendor.name;
    if (!acc[vName]) acc[vName] = [];
    acc[vName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handleCheckout = () => {
    toast.success('Order placed successfully! 🎉');
    clearCart();
    navigate('/orders');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <span className="text-6xl mb-4">🛒</span>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Start adding products from local vendors</p>
        <Button asChild className="gradient-hero text-primary-foreground border-none">
          <Link to="/search">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" /> Your Cart
        </h1>

        <div className="space-y-6">
          {Object.entries(vendorGroups).map(([vendorName, vendorItems]) => (
            <div key={vendorName} className="bg-card border rounded-xl overflow-hidden shadow-card">
              <div className="bg-muted px-4 py-3 border-b">
                <h3 className="font-display font-semibold text-foreground text-sm">{vendorName}</h3>
              </div>
              <div className="divide-y">
                {vendorItems.map(item => (
                  <div key={item.vendorProduct.id} className="flex items-center gap-4 p-4">
                    <span className="text-3xl">{item.vendorProduct.product.image}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{item.vendorProduct.product.name}</p>
                      <p className="text-xs text-muted-foreground">₹{item.vendorProduct.price} {item.vendorProduct.unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.vendorProduct.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-medium text-foreground text-sm">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.vendorProduct.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-display font-bold text-foreground w-16 text-right">₹{item.vendorProduct.price * item.quantity}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.vendorProduct.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-card border rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-display font-bold text-foreground text-lg">₹{totalPrice}</span>
          </div>
          <div className="flex items-center justify-between mb-4 text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-accent-foreground font-medium">Free</span>
          </div>
          <div className="border-t pt-4 flex items-center justify-between">
            <span className="font-display font-bold text-foreground text-lg">Total</span>
            <span className="font-display font-bold text-foreground text-xl">₹{totalPrice}</span>
          </div>
          <Button onClick={handleCheckout} className="w-full mt-4 gradient-hero text-primary-foreground border-none h-12 text-base font-semibold">
            Place Order <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
