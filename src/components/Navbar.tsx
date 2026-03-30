import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, ShoppingCart, User, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart-context';

export default function Navbar() {
  const { totalItems } = useCart();
  const { isAuthenticated, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isVendor = profile?.role === 'vendor';
  const isCustomer = profile?.role === 'customer';

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
    setMobileOpen(false);
  };

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
          {isCustomer && <NavItem to="/orders" active={isActive('/orders')}>My Orders</NavItem>}
          {isCustomer && <NavItem to="/customer" active={isActive('/customer')}>Dashboard</NavItem>}
          {isVendor && <NavItem to="/vendor" active={isActive('/vendor')}>Vendor Dashboard</NavItem>}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground" asChild>
            <Link to="/search"><Search className="h-5 w-5" /></Link>
          </Button>

          {isCustomer && (
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
          )}

          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex text-muted-foreground" asChild>
                <Link to="/dashboard">
                  <User className="h-4 w-4 mr-2" />
                  {profile?.name ?? 'Account'}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex text-muted-foreground" onClick={() => void handleSignOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex text-muted-foreground" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" className="hidden md:inline-flex gradient-hero text-primary-foreground border-none" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}

          <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 py-3 space-y-1">
          <MobileNavItem to="/" onClick={() => setMobileOpen(false)}>Home</MobileNavItem>
          <MobileNavItem to="/search" onClick={() => setMobileOpen(false)}>Browse</MobileNavItem>
          {isCustomer && <MobileNavItem to="/customer" onClick={() => setMobileOpen(false)}>Dashboard</MobileNavItem>}
          {isCustomer && <MobileNavItem to="/orders" onClick={() => setMobileOpen(false)}>My Orders</MobileNavItem>}
          {isVendor && <MobileNavItem to="/vendor" onClick={() => setMobileOpen(false)}>Vendor Dashboard</MobileNavItem>}
          {!isAuthenticated && <MobileNavItem to="/login" onClick={() => setMobileOpen(false)}>Login</MobileNavItem>}
          {!isAuthenticated && <MobileNavItem to="/signup" onClick={() => setMobileOpen(false)}>Sign up</MobileNavItem>}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Logout
            </button>
          )}
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
