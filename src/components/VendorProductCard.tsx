import { Star, MapPin, Clock, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VendorProduct } from '@/lib/mock-data';
import { useCart } from '@/lib/cart-context';

export default function VendorProductCard({ vp }: { vp: VendorProduct }) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find(i => i.vendorProduct.id === vp.id);

  return (
    <div className="bg-card border rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{vp.vendor.avatar}</span>
          <div>
            <h3 className="font-display font-semibold text-foreground text-sm">{vp.vendor.name}</h3>
            <p className="text-xs text-muted-foreground">{vp.vendor.type}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${vp.vendor.isOpen ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
          {vp.vendor.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-secondary text-secondary" />
          {vp.vendor.rating} ({vp.vendor.reviewCount})
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {vp.vendor.distance}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <div>
          <span className="font-display text-lg font-bold text-foreground">₹{vp.price}</span>
          <span className="text-xs text-muted-foreground ml-1">{vp.unit}</span>
        </div>

        {!vp.inStock ? (
          <span className="text-xs text-destructive font-medium">Out of Stock</span>
        ) : cartItem ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(vp.id, cartItem.quantity - 1)}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="font-medium text-foreground w-6 text-center">{cartItem.quantity}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(vp.id, cartItem.quantity + 1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => addItem(vp)} className="gradient-hero text-primary-foreground border-none">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        )}
      </div>
    </div>
  );
}
