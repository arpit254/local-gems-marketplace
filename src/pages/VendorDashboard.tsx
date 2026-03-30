import { useState } from 'react';
import { CheckCircle, Edit, Package, Plus, ShoppingBag, Trash2, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMarketplaceData } from '@/hooks/use-marketplace';

const myVendorId = 'v1';

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const { data, isLoading } = useMarketplaceData();
  const myProducts = (data?.vendorProducts ?? []).filter((vendorProduct) => vendorProduct.vendor.id === myVendorId);
  const vendor = (data?.vendors ?? []).find((entry) => entry.id === myVendorId);
  const vendorOrders = (data?.orders ?? []).filter((order) =>
    order.items.some((item) => item.vendorProduct.vendor.id === myVendorId)
  );

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Vendor Dashboard</h1>
            <p className="text-sm text-muted-foreground">{vendor?.name ?? "Ramesh's Fresh Veggies"}</p>
          </div>
          <Button className="gradient-hero text-primary-foreground border-none">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Products', value: myProducts.length, icon: Package },
            { label: 'Orders Today', value: vendorOrders.length, icon: ShoppingBag },
            { label: "Today's Revenue", value: `Rs ${vendorOrders.reduce((sum, order) => sum + order.total, 0)}`, icon: TrendingUp },
            { label: 'Rating', value: vendor ? `${vendor.rating} star` : 'N/A', icon: CheckCircle },
          ].map((stat, index) => (
            <div key={index} className="bg-card border rounded-xl p-4 shadow-card">
              <stat.icon className="h-5 w-5 text-primary mb-2" />
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

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
            {myProducts.map((vendorProduct) => (
              <div key={vendorProduct.id} className="bg-card border rounded-xl p-4 shadow-card flex items-center gap-4">
                <span className="text-3xl">{vendorProduct.product.image}</span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{vendorProduct.product.name}</p>
                  <p className="text-sm text-muted-foreground">Rs {vendorProduct.price} {vendorProduct.unit}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${vendorProduct.inStock ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive'}`}>
                  {vendorProduct.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {!isLoading && myProducts.length === 0 && (
              <div className="bg-card border rounded-xl p-6 text-sm text-muted-foreground shadow-card">
                No vendor products found in Supabase yet.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {vendorOrders.map((order) => (
              <div key={order.id} className="bg-card border rounded-xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-display font-semibold text-foreground">#{order.id}</p>
                    <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    order.status === 'placed' ? 'bg-secondary/10 text-secondary' :
                    order.status === 'accepted' ? 'bg-accent text-accent-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {order.items.map((item) => `${item.vendorProduct.product.name} x ${item.quantity}`).join(', ')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-foreground">Rs {order.total}</span>
                  {order.status === 'placed' && (
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
            {!isLoading && vendorOrders.length === 0 && (
              <div className="bg-card border rounded-xl p-6 text-sm text-muted-foreground shadow-card">
                No Supabase orders have been placed for this vendor yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
