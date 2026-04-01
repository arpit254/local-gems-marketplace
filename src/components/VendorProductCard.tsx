import { MapPin, Minus, Plus, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart-context';
import type { VendorProduct } from '@/lib/mock-data';

export default function VendorProductCard({
  showPrice = true,
  vp,
}: {
  showPrice?: boolean;
  vp: VendorProduct;
}) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((item) => item.vendorProduct.id === vp.id);

  return (
    <div className="rounded-xl border bg-card p-4 shadow-card transition-all hover:shadow-card-hover">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{vp.vendor.avatar}</span>
          <div>
            <Link to={`/vendors/${vp.vendor.id}`} className="font-display text-sm font-semibold text-foreground hover:text-primary">
              {vp.vendor.name}
            </Link>
            <p className="text-xs text-muted-foreground">{vp.vendor.type}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            vp.vendor.isOpen ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          {vp.vendor.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-secondary text-secondary" />
          {vp.vendor.rating} ({vp.vendor.reviewCount})
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {vp.vendor.distance}
        </span>
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <div>
          {showPrice ? (
            <>
              <span className="font-display text-lg font-bold text-foreground">Rs {vp.price}</span>
              <span className="ml-1 text-xs text-muted-foreground">{vp.unit}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Choose a product to view pricing</span>
          )}
        </div>

        {!vp.inStock ? (
          <span className="text-xs font-medium text-destructive">Out of Stock</span>
        ) : cartItem ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(vp.id, cartItem.quantity - 1)}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center font-medium text-foreground">{cartItem.quantity}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(vp.id, cartItem.quantity + 1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => addItem(vp)} className="border-none gradient-hero text-primary-foreground">
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        )}
      </div>
    </div>
  );
}
