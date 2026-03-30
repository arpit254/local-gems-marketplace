import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import {
  categories as fallbackCategories,
  products as fallbackProducts,
  sampleOrders as fallbackOrders,
  vendorProducts as fallbackVendorProducts,
  vendors as fallbackVendors,
} from '@/lib/mock-data';
import type { CartItem, Category, Order, Product, Vendor, VendorProduct } from '@/lib/mock-data';

export type MarketplaceData = {
  categories: Category[];
  orders: Order[];
  products: Product[];
  vendorProducts: VendorProduct[];
  vendors: Vendor[];
};

type OrderStatus = Order['status'];

const FALLBACK_DATA: MarketplaceData = {
  categories: fallbackCategories,
  orders: fallbackOrders,
  products: fallbackProducts,
  vendorProducts: fallbackVendorProducts,
  vendors: fallbackVendors,
};

function buildMarketplaceData(input: {
  categories: Array<{ id: string; name: string; emoji: string }>;
  orderItems: Array<{ order_id: string; quantity: number; vendor_product_id: string }>;
  orders: Array<{ created_at: string; id: string; status: OrderStatus; total: number; vendor_id: string }>;
  products: Array<{ category_id: string; id: string; image: string; name: string }>;
  vendorProducts: Array<{ id: string; in_stock: boolean; price: number; product_id: string; unit: string; vendor_id: string }>;
  vendors: Array<{
    address: string;
    avatar: string;
    distance: string;
    id: string;
    is_open: boolean;
    name: string;
    rating: number;
    review_count: number;
    type: string;
  }>;
}): MarketplaceData {
  const categories = input.categories.map((category) => ({
    emoji: category.emoji,
    id: category.id,
    name: category.name,
  }));

  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const products = input.products.map((product) => ({
    category: categoryById.get(product.category_id)?.name ?? 'Uncategorized',
    id: product.id,
    image: product.image,
    name: product.name,
  }));

  const productById = new Map(products.map((product) => [product.id, product]));

  const vendors = input.vendors.map((vendor) => ({
    address: vendor.address,
    avatar: vendor.avatar,
    distance: vendor.distance,
    id: vendor.id,
    isOpen: vendor.is_open,
    name: vendor.name,
    rating: vendor.rating,
    reviewCount: vendor.review_count,
    type: vendor.type,
  }));

  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));

  const vendorProducts = input.vendorProducts.flatMap((vendorProduct) => {
    const product = productById.get(vendorProduct.product_id);
    const vendor = vendorById.get(vendorProduct.vendor_id);

    if (!product || !vendor) {
      return [];
    }

    return [{
      id: vendorProduct.id,
      inStock: vendorProduct.in_stock,
      price: vendorProduct.price,
      product,
      unit: vendorProduct.unit,
      vendor,
    }];
  });

  const vendorProductById = new Map(vendorProducts.map((vendorProduct) => [vendorProduct.id, vendorProduct]));

  const orderItemsByOrderId = input.orderItems.reduce((acc, item) => {
    const vendorProduct = vendorProductById.get(item.vendor_product_id);
    if (!vendorProduct) {
      return acc;
    }

    const orderItems = acc.get(item.order_id) ?? [];
    orderItems.push({
      quantity: item.quantity,
      vendorProduct,
    });
    acc.set(item.order_id, orderItems);
    return acc;
  }, new Map<string, CartItem[]>());

  const orders = input.orders.flatMap((order) => {
    const items = orderItemsByOrderId.get(order.id);
    const vendor = vendorById.get(order.vendor_id);

    if (!items?.length || !vendor) {
      return [];
    }

    return [{
      createdAt: order.created_at,
      id: order.id,
      items,
      status: order.status,
      total: order.total,
      vendorName: vendor.name,
    }];
  });

  return {
    categories,
    orders,
    products,
    vendorProducts,
    vendors,
  };
}

export async function fetchMarketplaceData(): Promise<MarketplaceData> {
  const [categoriesResult, productsResult, vendorsResult, vendorProductsResult] = await Promise.all([
    supabase.from('categories').select('id, name, emoji').order('name'),
    supabase.from('products').select('id, name, image, category_id').order('name'),
    supabase.from('vendors').select('id, name, type, rating, review_count, distance, address, avatar, is_open').order('name'),
    supabase.from('vendor_products').select('id, product_id, vendor_id, price, unit, in_stock'),
  ]);

  const errors = [
    categoriesResult.error,
    productsResult.error,
    vendorsResult.error,
    vendorProductsResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors.map((error) => error?.message).join(', '));
  }

  let orders: Array<{ created_at: string; id: string; status: OrderStatus; total: number; vendor_id: string }> = [];
  let orderItems: Array<{ order_id: string; quantity: number; vendor_product_id: string }> = [];

  const sessionResult = await supabase.auth.getSession();

  if (!sessionResult.error && sessionResult.data.session) {
    const [ordersResult, orderItemsResult] = await Promise.all([
      supabase.from('orders').select('id, created_at, status, total, vendor_id').order('created_at', { ascending: false }),
      supabase.from('order_items').select('order_id, quantity, vendor_product_id'),
    ]);

    if (!ordersResult.error) {
      orders = ordersResult.data ?? [];
    }

    if (!orderItemsResult.error) {
      orderItems = orderItemsResult.data ?? [];
    }
  }

  return buildMarketplaceData({
    categories: categoriesResult.data ?? [],
    orderItems,
    orders,
    products: productsResult.data ?? [],
    vendorProducts: vendorProductsResult.data ?? [],
    vendors: vendorsResult.data ?? [],
  });
}

export function getFallbackMarketplaceData(): MarketplaceData {
  return FALLBACK_DATA;
}

export type CreateOrderInput = {
  customerName?: string;
  items: CartItem[];
  vendorId: string;
};

async function ensureCustomerSession() {
  const sessionResult = await supabase.auth.getSession();

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (sessionResult.data.session) {
    return sessionResult.data.session;
  }
  throw new Error('You must be logged in to place an order.');
}

export async function createOrder({ customerName = 'Guest Customer', items, vendorId }: CreateOrderInput) {
  await ensureCustomerSession();

  const total = items.reduce((sum, item) => sum + item.vendorProduct.price * item.quantity, 0);

  const orderPayload: TablesInsert<'orders'> = {
    customer_name: customerName,
    status: 'placed',
    total,
    vendor_id: vendorId,
  };

  const orderResult = await supabase.from('orders').insert(orderPayload).select('id').single();

  if (orderResult.error) {
    throw orderResult.error;
  }

  const orderId = orderResult.data.id;
  const orderItemsPayload: TablesInsert<'order_items'>[] = items.map((item) => ({
    order_id: orderId,
    quantity: item.quantity,
    vendor_product_id: item.vendorProduct.id,
  }));

  const orderItemsResult = await supabase.from('order_items').insert(orderItemsPayload);

  if (orderItemsResult.error) {
    throw orderItemsResult.error;
  }

  return orderId;
}
