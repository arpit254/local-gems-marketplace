import { Link } from 'react-router-dom';
import { Package, Search, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useMarketplaceData } from '@/hooks/use-marketplace';

export default function CustomerDashboard() {
  const { profile } = useAuth();
  const { data } = useMarketplaceData();
  const orders = data?.orders ?? [];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-primary font-semibold">Customer Dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
            Welcome back, {profile?.name ?? 'Shopper'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse nearby vendors, manage your cart, and track your latest orders in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Orders', value: orders.length, icon: Package },
            { label: 'Open Cart', value: 'Ready', icon: ShoppingBag },
            { label: 'Browse Market', value: 'Live', icon: Search },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border rounded-xl p-5 shadow-card">
              <stat.icon className="h-5 w-5 text-primary mb-3" />
              <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border rounded-xl p-6 shadow-card">
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">Continue shopping</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Search products from local vendors and compare prices instantly.
            </p>
            <Button asChild className="gradient-hero text-primary-foreground border-none">
              <Link to="/search">Browse products</Link>
            </Button>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-card">
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">Track your orders</h2>
            <p className="text-sm text-muted-foreground mb-4">
              View active and past orders placed from your account.
            </p>
            <Button asChild variant="outline">
              <Link to="/orders">View orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
