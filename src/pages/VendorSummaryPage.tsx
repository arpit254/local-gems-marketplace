import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Package, ShoppingBag, Star } from 'lucide-react';
import VendorProductCard from '@/components/VendorProductCard';
import { Button } from '@/components/ui/button';
import { useMarketplaceData } from '@/hooks/use-marketplace';

export default function VendorSummaryPage() {
  const { vendorId = '' } = useParams();
  const { data, isLoading } = useMarketplaceData();
  const [showAllProducts, setShowAllProducts] = useState(false);
  const vendor = (data?.vendors ?? []).find((entry) => entry.id === vendorId);
  const vendorProducts = (data?.vendorProducts ?? []).filter((entry) => entry.vendor.id === vendorId);
  const uniqueProducts = new Set(vendorProducts.map((entry) => entry.product.id));
  const categories = Array.from(new Set(vendorProducts.map((entry) => entry.product.category)));
  const displayedProducts = useMemo(
    () => (showAllProducts ? vendorProducts : vendorProducts.slice(0, 5)),
    [showAllProducts, vendorProducts]
  );
  const averagePrice =
    vendorProducts.length > 0
      ? Math.round(vendorProducts.reduce((sum, entry) => sum + entry.price, 0) / vendorProducts.length)
      : null;

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading vendor summary...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Vendor not found</h1>
        <p className="mt-2 text-muted-foreground">This store could not be loaded right now.</p>
        <Button asChild className="mt-6 border-none gradient-hero text-primary-foreground">
          <Link to="/search">Browse vendors</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{vendor.avatar}</span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Vendor Summary</p>
                <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{vendor.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{vendor.type}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-secondary text-secondary" />
                    {vendor.rating} ({vendor.reviewCount} reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {vendor.distance} • {vendor.address}
                  </span>
                  <span className={vendor.isOpen ? 'text-accent-foreground' : 'text-destructive'}>
                    {vendor.isOpen ? 'Open now' : 'Currently closed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <Package className="mb-3 h-5 w-5 text-primary" />
            <p className="font-display text-2xl font-bold text-foreground">{uniqueProducts.size}</p>
            <p className="text-sm text-muted-foreground">Unique products listed</p>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <ShoppingBag className="mb-3 h-5 w-5 text-primary" />
            <p className="font-display text-2xl font-bold text-foreground">{vendorProducts.length}</p>
            <p className="text-sm text-muted-foreground">Active product listings</p>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <Star className="mb-3 h-5 w-5 text-primary" />
            <p className="font-display text-2xl font-bold text-foreground">
              {averagePrice !== null ? `Rs ${averagePrice}` : 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">Average listing price</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="font-display text-xl font-bold text-foreground">Store highlights</h2>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Serves nearby shoppers</p>
                <p className="mt-1">Customers can expect delivery from {vendor.distance} away at {vendor.address}.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Popular categories</p>
                <p className="mt-1">{categories.length > 0 ? categories.join(', ') : 'No categories listed yet.'}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Why buy here</p>
                <p className="mt-1">
                  Strong customer ratings, a local delivery radius, and visible stock information make this vendor easy to trust.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">
                {showAllProducts ? 'All products' : 'Featured products'}
              </h2>
              {vendorProducts.length > 5 && (
                <Button variant="ghost" onClick={() => setShowAllProducts((current) => !current)}>
                  {showAllProducts ? 'Show less' : 'View all products'}
                </Button>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {displayedProducts.map((entry) => (
                <VendorProductCard key={entry.id} vp={entry} />
              ))}
              {vendorProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">No products are listed for this vendor yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
