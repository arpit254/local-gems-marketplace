import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, SlidersHorizontal, Star } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import VendorProductCard from '@/components/VendorProductCard';
import { Button } from '@/components/ui/button';
import { useMarketplaceData } from '@/hooks/use-marketplace';

type SortBy = 'price_asc' | 'price_desc' | 'rating' | 'distance';

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const category = params.get('category') || '';
  const vendorId = params.get('vendor') || '';
  const [sortBy, setSortBy] = useState<SortBy>('price_asc');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const { data, isLoading } = useMarketplaceData();
  const products = data?.products ?? [];
  const categories = data?.categories ?? [];
  const vendorProducts = data?.vendorProducts ?? [];
  const categoryOnlyView = Boolean(category && !query.trim() && !vendorId);
  const showPrice = Boolean(query.trim() || vendorId || !category);

  const results = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const matchedProducts = products.filter((product) => {
      if (category && product.category !== category) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery)
      );
    });

    const productIds = new Set(matchedProducts.map((product) => product.id));
    let listings = vendorProducts.filter((vendorProduct) => productIds.has(vendorProduct.product.id));

    if (vendorId) {
      listings = listings.filter((vendorProduct) => vendorProduct.vendor.id === vendorId);
    }

    listings = listings.filter((vendorProduct) => (
      vendorProduct.price >= priceRange[0] && vendorProduct.price <= priceRange[1]
    ));

    switch (sortBy) {
      case 'price_asc':
        listings.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        listings.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        listings.sort((a, b) => b.vendor.rating - a.vendor.rating);
        break;
      case 'distance':
        listings.sort((a, b) => parseFloat(a.vendor.distance) - parseFloat(b.vendor.distance));
        break;
    }

    return listings;
  }, [category, priceRange, products, query, sortBy, vendorId, vendorProducts]);

  const vendorResults = useMemo(() => {
    const uniqueVendors = new Map<string, (typeof results)[number]['vendor']>();

    for (const listing of results) {
      if (!uniqueVendors.has(listing.vendor.id)) {
        uniqueVendors.set(listing.vendor.id, listing.vendor);
      }
    }

    return Array.from(uniqueVendors.values());
  }, [results]);

  const title = query ? `Results for "${query}"` : category ? category : vendorId ? 'Vendor Products' : 'All Products';

  return (
    <div className="min-h-screen">
      <div className="bg-muted/50 py-6">
        <div className="container mx-auto px-4">
          <SearchBar />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {categoryOnlyView ? vendorResults.length : results.length} vendors found
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
          </Button>
        </div>

        {showFilters && (
          <div className="bg-card border rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                className="text-sm border rounded-lg px-3 py-1.5 bg-background text-foreground"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rating</option>
                <option value="distance">Nearest First</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Max price: Rs {priceRange[1]}</label>
              <input
                type="range"
                min={0}
                max={500}
                value={priceRange[1]}
                onChange={e => setPriceRange([0, parseInt(e.target.value, 10)])}
                className="accent-primary"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <a
                  key={cat.id}
                  href={`/search?category=${encodeURIComponent(cat.name)}`}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    category === cat.name ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {cat.emoji} {cat.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">Loading products...</h2>
            <p className="text-muted-foreground">Fetching the latest vendor listings from Supabase.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">Search</span>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">No results found</h2>
            <p className="text-muted-foreground">Try searching for something else</p>
          </div>
        ) : (
          <>
            {categoryOnlyView ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendorResults.map((vendor) => (
                  <Link
                    key={vendor.id}
                    to={`/vendors/${vendor.id}`}
                    className="rounded-xl border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{vendor.avatar}</span>
                        <div>
                          <h3 className="font-display text-lg font-semibold text-foreground">{vendor.name}</h3>
                          <p className="text-sm text-muted-foreground">{vendor.type}</p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          vendor.isOpen ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {vendor.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-secondary text-secondary" />
                        {vendor.rating} ({vendor.reviewCount})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {vendor.distance}
                      </span>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm text-muted-foreground">
                        View this vendor&apos;s summary and product catalog.
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((vp) => (
                  <VendorProductCard key={vp.id} vp={vp} showPrice={showPrice} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
