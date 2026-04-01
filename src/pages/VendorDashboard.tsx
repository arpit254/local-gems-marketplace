import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Edit, Package, Plus, ShoppingBag, Trash2, Truck, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import AccountDangerZone from '@/components/AccountDangerZone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreateVendorProduct,
  useDeleteVendorProduct,
  useMarketplaceData,
  useRecreateVendorProfile,
  useUpdateOrderStatus,
  useUpdateVendorProduct,
} from '@/hooks/use-marketplace';
import { useAuth } from '@/lib/auth';
import type { OrderStatus, VendorProduct } from '@/lib/mock-data';

type ProductFormState = {
  categoryId: string;
  image: string;
  inStock: boolean;
  name: string;
  price: string;
  unit: string;
};

const EMPTY_FORM: ProductFormState = {
  categoryId: '',
  image: '',
  inStock: true,
  name: '',
  price: '',
  unit: '',
};

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Could not save the product.';
}

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const { profile } = useAuth();
  const { data, isLoading } = useMarketplaceData();
  const createVendorProduct = useCreateVendorProduct();
  const updateVendorProduct = useUpdateVendorProduct();
  const deleteVendorProduct = useDeleteVendorProduct();
  const updateOrderStatus = useUpdateOrderStatus();
  const categories = data?.categories ?? [];
  const products = data?.products ?? [];
  const vendor = (data?.vendors ?? []).find((entry) => entry.ownerUserId === profile?.id) ?? null;
  const myVendorId = vendor?.id ?? '';
  const myProducts = (data?.vendorProducts ?? []).filter((vendorProduct) => vendorProduct.vendor.id === myVendorId);
  const vendorOrders = (data?.orders ?? []).filter((order) =>
    order.items.some((item) => item.vendorProduct.vendor.id === myVendorId)
  );

  const categoryNameByProductId = useMemo(() => new Map(products.map((product) => [product.id, product.category])), [products]);

  const recreateVendorProfile = useRecreateVendorProfile();
  const isSubmitting = createVendorProduct.isPending || updateVendorProduct.isPending;

  const handleRecreateVendor = async () => {
    if (!profile) {
      toast.error('Unable to recreate vendor profile without signed-in user.');
      return;
    }

    try {
      await recreateVendorProfile.mutateAsync({ userId: profile.id, name: profile.name });
      toast.success('Vendor profile recreated successfully.');
    } catch (error) {
      console.error('[vendor] Failed to recreate vendor profile', error);
      toast.error(getErrorMessage(error));
    }
  };

  const openAddDialog = () => {
    if (!vendor) {
      toast.error('Your vendor profile is still being created. Please refresh in a moment.');
      return;
    }

    setEditingProduct(null);
    setFormState({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id ?? '',
      image: '🥬',
      unit: 'per kg',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (vendorProduct: VendorProduct) => {
    const matchingCategory = categories.find((category) => category.name === vendorProduct.product.category);

    setEditingProduct(vendorProduct);
    setFormState({
      categoryId: matchingCategory?.id ?? categories[0]?.id ?? '',
      image: vendorProduct.product.image,
      inStock: vendorProduct.inStock,
      name: vendorProduct.product.name,
      price: String(vendorProduct.price),
      unit: vendorProduct.unit,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    setFormError('');

    const trimmedName = formState.name.trim();
    const trimmedUnit = formState.unit.trim();
    const trimmedImage = formState.image.trim();
    const parsedPrice = Number(formState.price);

    if (!trimmedName || !trimmedUnit || !trimmedImage || !formState.categoryId) {
      setFormError('Please fill in all required product fields.');
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setFormError('Price must be a valid number greater than zero.');
      return;
    }

    try {
      if (editingProduct) {
        await updateVendorProduct.mutateAsync({
          categoryId: formState.categoryId,
          image: trimmedImage,
          inStock: formState.inStock,
          name: trimmedName,
          price: parsedPrice,
          productId: editingProduct.product.id,
          unit: trimmedUnit,
          vendorId: myVendorId,
          vendorProductId: editingProduct.id,
        });
        toast.success('Product updated successfully.');
      } else {
        await createVendorProduct.mutateAsync({
          categoryId: formState.categoryId,
          image: trimmedImage,
          inStock: formState.inStock,
          name: trimmedName,
          price: parsedPrice,
          unit: trimmedUnit,
          vendorId: myVendorId,
        });
        toast.success('Product added successfully.');
      }

      setDialogOpen(false);
    } catch (error) {
      console.error('[vendor] Failed to save product', error);
      setFormError(getErrorMessage(error));
    }
  };

  const handleDeleteProduct = async (vendorProduct: VendorProduct) => {
    try {
      await deleteVendorProduct.mutateAsync({
        productId: vendorProduct.product.id,
        vendorProductId: vendorProduct.id,
      });
      toast.success('Product removed successfully.');
    } catch (error) {
      console.error('[vendor] Failed to delete product', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus.mutateAsync({ orderId, status });
      toast.success(status === 'accepted' ? 'Order accepted successfully.' : 'Order rejected successfully.');
    } catch (error) {
      console.error('[vendor] Failed to update order status', error);
      toast.error(getErrorMessage(error));
    }
  };

  if (!isLoading && !vendor) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-2xl border bg-card p-8 shadow-card">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Account not found</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              We could not find your account details in the database. Restore the missing record to continue.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                className="border-none gradient-hero text-primary-foreground"
                onClick={() => void handleRecreateVendor()}
                disabled={recreateVendorProfile.isPending}
              >
                {recreateVendorProfile.isPending ? 'Restoring...' : 'Restore Account'}
              </Button>
              <Button asChild variant="outline">
                <Link to="/search">Browse products</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Vendor Dashboard</h1>
            <p className="text-sm text-muted-foreground">{vendor?.name ?? 'Setting up your vendor profile...'}</p>
          </div>
          <Button onClick={openAddDialog} disabled={!vendor} className="border-none gradient-hero text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Products', value: myProducts.length, icon: Package },
            { label: 'Orders Today', value: vendorOrders.length, icon: ShoppingBag },
            { label: "Today's Revenue", value: `Rs ${vendorOrders.reduce((sum, order) => sum + order.total, 0)}`, icon: TrendingUp },
            { label: 'Rating', value: vendor ? `${vendor.rating} star` : 'N/A', icon: CheckCircle },
          ].map((stat, index) => (
            <div key={index} className="rounded-xl border bg-card p-4 shadow-card">
              <stat.icon className="mb-2 h-5 w-5 text-primary" />
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="mb-2 font-display text-xl font-semibold text-foreground">Order from the marketplace</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Vendors can also shop as customers. Browse products, add items to cart, and place orders from here.
            </p>
            <Button asChild className="border-none gradient-hero text-primary-foreground">
              <Link to="/search">Browse products</Link>
            </Button>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="mb-2 font-display text-xl font-semibold text-foreground">Track your purchases</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Review orders you placed for your own account and continue checkout from your cart.
            </p>
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link to="/orders">My orders</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/cart">View cart</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <Button
            variant={activeTab === 'products' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('products')}
            className={activeTab === 'products' ? 'border-none gradient-hero text-primary-foreground' : ''}
          >
            My Products
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('orders')}
            className={activeTab === 'orders' ? 'border-none gradient-hero text-primary-foreground' : ''}
          >
            Incoming Orders
          </Button>
        </div>

        {activeTab === 'products' ? (
          <div className="space-y-3">
            {myProducts.map((vendorProduct) => (
              <div key={vendorProduct.id} className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card">
                <span className="text-3xl">{vendorProduct.product.image}</span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{vendorProduct.product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {vendorProduct.product.category} • Rs {vendorProduct.price} {vendorProduct.unit}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    vendorProduct.inStock ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {vendorProduct.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(vendorProduct)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={deleteVendorProduct.isPending}
                    onClick={() => void handleDeleteProduct(vendorProduct)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!isLoading && myProducts.length === 0 && (
              <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-card">
                {vendor ? 'No vendor products found in Supabase yet.' : 'Account not found.'}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {vendorOrders.map((order) => {
              const nextStatusMap: Record<string, { status: OrderStatus; label: string; icon: typeof CheckCircle }> = {
                placed: { status: 'accepted', label: 'Accept', icon: CheckCircle },
                to_be_confirmed: { status: 'accepted', label: 'Confirm & Accept', icon: CheckCircle },
                accepted: { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
                out_for_delivery: { status: 'delivered', label: 'Mark Delivered', icon: Package },
              };
              const nextAction = nextStatusMap[order.status];
              const canReject = order.status === 'placed' || order.status === 'to_be_confirmed';
              const isTerminal = order.status === 'delivered' || order.status === 'cancelled';
              const stepMap: Record<string, number> = { to_be_confirmed: 0, placed: 1, accepted: 2, out_for_delivery: 3, delivered: 4, cancelled: 0 };
              const currentStep = stepMap[order.status] ?? 0;

              return (
                <div key={order.id} className="rounded-xl border bg-card p-4 shadow-card">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-display font-semibold text-foreground">#{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        order.status === 'delivered'
                          ? 'bg-accent text-accent-foreground'
                        : order.status === 'cancelled'
                          ? 'bg-destructive/10 text-destructive'
                        : order.status === 'out_for_delivery'
                          ? 'bg-secondary/10 text-secondary'
                        : order.status === 'accepted'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Progress tracker */}
                  {!isTerminal && (
                    <div className="mb-3 flex items-center gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div key={step} className={`h-1.5 flex-1 rounded-full transition-all ${step <= currentStep ? 'gradient-hero' : 'bg-muted'}`} />
                      ))}
                    </div>
                  )}

                  <p className="mb-3 text-sm text-muted-foreground">
                    {order.items.map((item) => `${item.vendorProduct.product.image} ${item.vendorProduct.product.name} × ${item.quantity}`).join(' • ')}
                  </p>

                  {order.deliveryAddress && (
                    <p className="mb-2 text-xs text-muted-foreground">📍 {order.deliveryAddress}</p>
                  )}
                  {order.phoneNumber && (
                    <p className="mb-2 text-xs text-muted-foreground">📞 {order.phoneNumber}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-foreground">₹{order.total}</span>
                    {!isTerminal && (
                      <div className="flex gap-2">
                        {nextAction && (
                          <Button
                            size="sm"
                            className="border-none gradient-hero text-primary-foreground"
                            disabled={updateOrderStatus.isPending}
                            onClick={() => void handleUpdateOrderStatus(order.id, nextAction.status)}
                          >
                            <nextAction.icon className="mr-1 h-4 w-4" /> {nextAction.label}
                          </Button>
                        )}
                        {canReject && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            disabled={updateOrderStatus.isPending}
                            onClick={() => void handleUpdateOrderStatus(order.id, 'cancelled')}
                          >
                            <X className="mr-1 h-4 w-4" /> Reject
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {!isLoading && vendorOrders.length === 0 && (
              <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-card">
                No orders have been placed for this vendor yet.
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <AccountDangerZone />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update your listing details and inventory information.'
                : 'Create a new product listing for your vendor profile.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="Fresh coriander"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formState.categoryId}
                  onChange={(event) => setFormState((current) => ({ ...current, categoryId: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emoji">Emoji / Image</Label>
                <Input
                  id="emoji"
                  value={formState.image}
                  onChange={(event) => setFormState((current) => ({ ...current, image: event.target.value }))}
                  placeholder="🥬"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formState.price}
                  onChange={(event) => setFormState((current) => ({ ...current, price: event.target.value }))}
                  placeholder="40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formState.unit}
                  onChange={(event) => setFormState((current) => ({ ...current, unit: event.target.value }))}
                  placeholder="per kg"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={formState.inStock}
                onChange={(event) => setFormState((current) => ({ ...current, inStock: event.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              Product is currently in stock
            </label>

            {editingProduct && (
              <p className="text-xs text-muted-foreground">
                Existing category: {categoryNameByProductId.get(editingProduct.product.id) ?? editingProduct.product.category}
              </p>
            )}

            {formError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveProduct()} disabled={isSubmitting} className="border-none gradient-hero text-primary-foreground">
              {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
