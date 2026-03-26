import { useState } from 'react';
import { vendorProducts, products } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Package, Plus, Edit, Trash2, ShoppingBag, CheckCircle, X, TrendingUp } from 'lucide-react';

const myVendorId = 'v1'; // Mock: current vendor

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const myProducts = vendorProducts.filter(vp => vp.vendor.id === myVendorId);

  const mockOrders = [
    { id: 'VO001', customer: 'Priya S.', items: 'Tomatoes × 2, Onions × 1', total: 110, status: 'pending' as const },
    { id: 'VO002', customer: 'Arjun M.', items: 'Bananas × 1, Green Chillies × 2', total: 75, status: 'accepted' as const },
    { id: 'VO003', customer: 'Sneha K.', items: 'Potatoes × 3', total: 75, status: 'delivered' as const },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Vendor Dashboard</h1>
            <p className="text-sm text-muted-foreground">Ramesh's Fresh Veggies</p>
          </div>
          <Button className="gradient-hero text-primary-foreground border-none">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Products', value: myProducts.length, icon: Package },
            { label: 'Orders Today', value: 12, icon: ShoppingBag },
            { label: "Today's Revenue", value: '₹1,240', icon: TrendingUp },
            { label: 'Rating', value: '4.5 ⭐', icon: CheckCircle },
          ].map((stat, i) => (
            <div key={i} className="bg-card border rounded-xl p-4 shadow-card">
              <stat.icon className="h-5 w-5 text-primary mb-2" />
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'products' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('products')}
            className={activeTab === 'products' ? 'gradient-hero text-primary-foreground border-none' : ''}
          >
            My Products
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('orders')}
            className={activeTab === 'orders' ? 'gradient-hero text-primary-foreground border-none' : ''}
          >
            Incoming Orders
          </Button>
        </div>

        {activeTab === 'products' ? (
          <div className="space-y-3">
            {myProducts.map(vp => (
              <div key={vp.id} className="bg-card border rounded-xl p-4 shadow-card flex items-center gap-4">
                <span className="text-3xl">{vp.product.image}</span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{vp.product.name}</p>
                  <p className="text-sm text-muted-foreground">₹{vp.price} {vp.unit}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${vp.inStock ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive'}`}>
                  {vp.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {mockOrders.map(order => (
              <div key={order.id} className="bg-card border rounded-xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-display font-semibold text-foreground">#{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.customer}</p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    order.status === 'pending' ? 'bg-secondary/10 text-secondary' :
                    order.status === 'accepted' ? 'bg-accent text-accent-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{order.items}</p>
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-foreground">₹{order.total}</span>
                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" className="gradient-hero text-primary-foreground border-none">
                        <CheckCircle className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive">
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
