import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, MapPin, Menu, X } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Navbar() {
  const { totalItems } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <span className="font-display text-xl font-bold text-foreground">
            Local<span className="text-primary">Kart</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <NavItem to="/" active={isActive('/')}>Home</NavItem>
          <NavItem to="/search" active={isActive('/search')}>Browse</NavItem>
          <NavItem to="/orders" active={isActive('/orders')}>My Orders</NavItem>
          <NavItem to="/vendor" active={isActive('/vendor')}>Vendor</NavItem>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground" asChild>
            <Link to="/search"><Search className="h-5 w-5" /></Link>
          </Button>

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 py-3 space-y-1">
          <MobileNavItem to="/" onClick={() => setMobileOpen(false)}>Home</MobileNavItem>
          <MobileNavItem to="/search" onClick={() => setMobileOpen(false)}>Browse</MobileNavItem>
          <MobileNavItem to="/orders" onClick={() => setMobileOpen(false)}>My Orders</MobileNavItem>
          <MobileNavItem to="/vendor" onClick={() => setMobileOpen(false)}>Vendor Dashboard</MobileNavItem>
        </div>
      )}
    </nav>
  );
}

function NavItem({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavItem({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className="block px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
      {children}
    </Link>
  );
}
