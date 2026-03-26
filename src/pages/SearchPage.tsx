import { useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import VendorProductCard from '@/components/VendorProductCard';
import { searchProducts, getVendorsForProduct, getProductsByCategory, categories, vendorProducts } from '@/lib/mock-data';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SortBy = 'price_asc' | 'price_desc' | 'rating' | 'distance';

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const category = params.get('category') || '';
  const [sortBy, setSortBy] = useState<SortBy>('price_asc');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);

  const results = useMemo(() => {
    let matchedProducts = query
      ? searchProducts(query)
      : category
      ? getProductsByCategory(category)
      : searchProducts('');

    let vps = matchedProducts.flatMap(p => getVendorsForProduct(p.id));

    // Price filter
    vps = vps.filter(vp => vp.price >= priceRange[0] && vp.price <= priceRange[1]);

    // Sort
    switch (sortBy) {
      case 'price_asc': vps.sort((a, b) => a.price - b.price); break;
      case 'price_desc': vps.sort((a, b) => b.price - a.price); break;
      case 'rating': vps.sort((a, b) => b.vendor.rating - a.vendor.rating); break;
      case 'distance': vps.sort((a, b) => parseFloat(a.vendor.distance) - parseFloat(b.vendor.distance)); break;
    }

    return vps;
  }, [query, category, sortBy, priceRange]);

  const title = query ? `Results for "${query}"` : category ? category : 'All Products';

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
            <p className="text-sm text-muted-foreground">{results.length} vendors found</p>
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
              <label className="text-xs font-medium text-muted-foreground block mb-1">Max price: ₹{priceRange[1]}</label>
              <input
                type="range"
                min={0}
                max={500}
                value={priceRange[1]}
                onChange={e => setPriceRange([0, parseInt(e.target.value)])}
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

        {results.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">🔍</span>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">No results found</h2>
            <p className="text-muted-foreground">Try searching for something else</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(vp => (
              <VendorProductCard key={vp.id} vp={vp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
