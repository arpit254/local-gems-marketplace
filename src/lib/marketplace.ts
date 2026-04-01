import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import {
  categories as fallbackCategories,
  products as fallbackProducts,
  sampleOrders as fallbackOrders,
  vendorProducts as fallbackVendorProducts,
  vendors as fallbackVendors,
} from '@/lib/mock-data';
import { groupCartItemsByVendor } from '@/lib/checkout';
import type { CartItem, Category, Order, OrderStatus, PaymentMethod, PaymentStatus, Product, Vendor, VendorProduct } from '@/lib/mock-data';

export type MarketplaceData = {
  categories: Category[];
  orders: Order[];
  products: Product[];
  vendorProducts: VendorProduct[];
  vendors: Vendor[];
};

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
  orders: Array<{
    created_at: string;
    id: string;
    delivery_address: string | null;
    delivery_instructions: string | null;
    delivery_landmark: string | null;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    phone_number: string | null;
    status: OrderStatus;
    total: number;
    vendor_id: string;
  }>;
  products: Array<{ category_id: string; id: string; image: string; name: string }>;
  vendorProducts: Array<{ id: string; in_stock: boolean; price: number; product_id: string; unit: string; vendor_id: string }>;
  vendors: Array<{
    address: string;
    avatar: string;
    distance: string;
    id: string;
    is_open: boolean;
    name: string;
    owner_user_id: string | null;
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
    ownerUserId: vendor.owner_user_id ?? undefined,
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
      deliveryAddress: order.delivery_address ?? undefined,
      deliveryInstructions: order.delivery_instructions ?? undefined,
      deliveryLandmark: order.delivery_landmark ?? undefined,
      id: order.id,
      items,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      phoneNumber: order.phone_number ?? undefined,
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
    supabase.from('vendors').select('id, name, type, rating, review_count, distance, address, avatar, is_open, owner_user_id').order('name'),
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

  let orders: Array<{
    created_at: string;
    id: string;
    delivery_address: string | null;
    delivery_instructions: string | null;
    delivery_landmark: string | null;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    phone_number: string | null;
    status: OrderStatus;
    total: number;
    vendor_id: string;
  }> = [];
  let orderItems: Array<{ order_id: string; quantity: number; vendor_product_id: string }> = [];

  const sessionResult = await supabase.auth.getSession();

  if (!sessionResult.error && sessionResult.data.session) {
    const [ordersResult, orderItemsResult] = await Promise.all([
      supabase
        .from('orders')
        .select('id, created_at, delivery_address, delivery_instructions, delivery_landmark, payment_method, payment_status, phone_number, status, total, vendor_id')
        .order('created_at', { ascending: false }),
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
  deliveryAddress: string;
  deliveryInstructions?: string;
  deliveryLandmark?: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  phoneNumber: string;
  vendorId: string;
};

export type CreateCheckoutOrdersInput = {
  customerName?: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  deliveryLandmark?: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  phoneNumber: string;
};

export type UpsertVendorProductInput = {
  categoryId: string;
  image: string;
  inStock: boolean;
  name: string;
  price: number;
  productId?: string;
  unit: string;
  vendorId: string;
  vendorProductId?: string;
};

export type UpdateOrderStatusInput = {
  orderId: string;
  status: OrderStatus;
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

export async function createOrder({
  customerName = 'Guest Customer',
  deliveryAddress,
  deliveryInstructions,
  deliveryLandmark,
  items,
  paymentMethod,
  paymentStatus,
  phoneNumber,
  vendorId,
}: CreateOrderInput) {
  await ensureCustomerSession();

  const total = items.reduce((sum, item) => sum + item.vendorProduct.price * item.quantity, 0);

  const orderPayload: TablesInsert<'orders'> = {
    customer_name: customerName,
    delivery_address: deliveryAddress,
    delivery_instructions: deliveryInstructions ?? null,
    delivery_landmark: deliveryLandmark ?? null,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    phone_number: phoneNumber,
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

export async function createCheckoutOrders({
  customerName = 'Guest Customer',
  deliveryAddress,
  deliveryInstructions,
  deliveryLandmark,
  items,
  paymentMethod,
  paymentStatus,
  phoneNumber,
}: CreateCheckoutOrdersInput) {
  if (items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const groupedItems = Array.from(groupCartItemsByVendor(items).entries());
  const orderIds = await Promise.all(
    groupedItems.map(([vendorId, vendorItems]) =>
      createOrder({
        customerName,
        deliveryAddress,
        deliveryInstructions,
        deliveryLandmark,
        items: vendorItems,
        paymentMethod,
        paymentStatus,
        phoneNumber,
        vendorId,
      })
    )
  );

  return orderIds;
}

export async function recreateVendorProfile({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  await ensureCustomerSession();

  const vendorId = `vendor-${userId.slice(0, 8).replace(/-/g, '')}`;

  const result = await supabase
    .from('vendors')
    .upsert(
      {
        id: vendorId,
        name: name || 'New Vendor',
        type: 'Local Shop',
        rating: 0,
        review_count: 0,
        distance: '0 km',
        address: 'Update your shop address',
        avatar: '🏪',
        owner_user_id: userId,
        is_open: true,
      },
      { onConflict: 'owner_user_id' }
    );

  if (result.error) {
    throw result.error;
  }

  return vendorId;
}

export async function createVendorProduct({
  categoryId,
  image,
  inStock,
  name,
  price,
  unit,
  vendorId,
}: UpsertVendorProductInput) {
  await ensureCustomerSession();

  const productId = `product-${crypto.randomUUID()}`;
  const vendorProductId = `vp-${crypto.randomUUID()}`;

  const productResult = await supabase.from('products').insert({
    category_id: categoryId,
    id: productId,
    image,
    name,
  });

  if (productResult.error) {
    throw productResult.error;
  }

  const vendorProductResult = await supabase.from('vendor_products').insert({
    id: vendorProductId,
    in_stock: inStock,
    price,
    product_id: productId,
    unit,
    vendor_id: vendorId,
  });

  if (vendorProductResult.error) {
    throw vendorProductResult.error;
  }

  return vendorProductId;
}

export async function updateVendorProduct({
  categoryId,
  image,
  inStock,
  name,
  price,
  productId,
  unit,
  vendorId,
  vendorProductId,
}: UpsertVendorProductInput) {
  await ensureCustomerSession();

  if (!productId || !vendorProductId) {
    throw new Error('Missing product identifiers for update.');
  }

  let nextProductId = productId;

  const siblingListingsResult = await supabase
    .from('vendor_products')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (siblingListingsResult.error) {
    throw siblingListingsResult.error;
  }

  const isSharedProduct = (siblingListingsResult.count ?? 0) > 1;

  if (isSharedProduct) {
    nextProductId = `product-${crypto.randomUUID()}`;

    const clonedProductResult = await supabase.from('products').insert({
      category_id: categoryId,
      id: nextProductId,
      image,
      name,
    });

    if (clonedProductResult.error) {
      throw clonedProductResult.error;
    }
  } else {
    const productResult = await supabase
      .from('products')
      .update({
        category_id: categoryId,
        image,
        name,
      })
      .eq('id', productId);

    if (productResult.error) {
      throw productResult.error;
    }
  }

  const vendorProductResult = await supabase
    .from('vendor_products')
    .update({
      in_stock: inStock,
      price,
      product_id: nextProductId,
      unit,
      vendor_id: vendorId,
    })
    .eq('id', vendorProductId);

  if (vendorProductResult.error) {
    throw vendorProductResult.error;
  }

  return vendorProductId;
}

export async function deleteVendorProduct(vendorProductId: string, productId: string) {
  await ensureCustomerSession();

  const vendorProductResult = await supabase.from('vendor_products').delete().eq('id', vendorProductId);

  if (vendorProductResult.error) {
    throw vendorProductResult.error;
  }

  const remainingListingsResult = await supabase
    .from('vendor_products')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (remainingListingsResult.error) {
    throw remainingListingsResult.error;
  }

  if ((remainingListingsResult.count ?? 0) === 0) {
    const productResult = await supabase.from('products').delete().eq('id', productId);

    if (productResult.error) {
      throw productResult.error;
    }
  }
}

export async function updateOrderStatus({ orderId, status }: UpdateOrderStatusInput) {
  await ensureCustomerSession();

  const payload: TablesUpdate<'orders'> = {
    status,
  };

  const result = await supabase
    .from('orders')
    .update(payload)
    .eq('id', orderId)
    .select('id')
    .single();

  if (result.error) {
    throw result.error;
  }

  return result.data.id;
}
