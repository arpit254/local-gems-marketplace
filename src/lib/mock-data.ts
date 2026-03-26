export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
}

export interface VendorProduct {
  id: string;
  product: Product;
  vendor: Vendor;
  price: number;
  unit: string;
  inStock: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviewCount: number;
  distance: string;
  address: string;
  avatar: string;
  isOpen: boolean;
}

export interface CartItem {
  vendorProduct: VendorProduct;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  status: 'placed' | 'accepted' | 'out_for_delivery' | 'delivered';
  total: number;
  createdAt: string;
  vendorName: string;
}

export const categories = [
  { id: '1', name: 'Vegetables', emoji: '🥬' },
  { id: '2', name: 'Fruits', emoji: '🍎' },
  { id: '3', name: 'Dairy', emoji: '🥛' },
  { id: '4', name: 'Snacks', emoji: '🍿' },
  { id: '5', name: 'Beverages', emoji: '🧃' },
  { id: '6', name: 'Grocery', emoji: '🛒' },
  { id: '7', name: 'Bakery', emoji: '🍞' },
  { id: '8', name: 'Meat & Fish', emoji: '🥩' },
];

export const vendors: Vendor[] = [
  { id: 'v1', name: "Ramesh's Fresh Veggies", type: 'Street Vendor', rating: 4.5, reviewCount: 128, distance: '0.3 km', address: '12 Main Market, Sector 5', avatar: '🧑‍🌾', isOpen: true },
  { id: 'v2', name: 'Sharma General Store', type: 'Local Shop', rating: 4.2, reviewCount: 85, distance: '0.5 km', address: '45 Gandhi Road', avatar: '🏪', isOpen: true },
  { id: 'v3', name: 'Lakshmi Dairy Corner', type: 'Dairy Shop', rating: 4.8, reviewCount: 210, distance: '0.8 km', address: '78 Nehru Street', avatar: '🐄', isOpen: true },
  { id: 'v4', name: "Anwar's Fruit Cart", type: 'Street Vendor', rating: 4.3, reviewCount: 64, distance: '0.2 km', address: 'Near Bus Stand', avatar: '🍉', isOpen: false },
  { id: 'v5', name: 'Singh Kirana Store', type: 'Grocery Store', rating: 4.6, reviewCount: 156, distance: '1.1 km', address: '23 Market Complex', avatar: '🏬', isOpen: true },
];

export const products: Product[] = [
  { id: 'p1', name: 'Fresh Tomatoes', category: 'Vegetables', image: '🍅' },
  { id: 'p2', name: 'Onions', category: 'Vegetables', image: '🧅' },
  { id: 'p3', name: 'Potatoes', category: 'Vegetables', image: '🥔' },
  { id: 'p4', name: 'Milk (1L)', category: 'Dairy', image: '🥛' },
  { id: 'p5', name: 'Curd (500g)', category: 'Dairy', image: '🫕' },
  { id: 'p6', name: 'Apples', category: 'Fruits', image: '🍎' },
  { id: 'p7', name: 'Bananas', category: 'Fruits', image: '🍌' },
  { id: 'p8', name: 'Bread', category: 'Bakery', image: '🍞' },
  { id: 'p9', name: 'Eggs (12pc)', category: 'Grocery', image: '🥚' },
  { id: 'p10', name: 'Rice (1kg)', category: 'Grocery', image: '🍚' },
  { id: 'p11', name: 'Chips', category: 'Snacks', image: '🍟' },
  { id: 'p12', name: 'Biscuits', category: 'Snacks', image: '🍪' },
  { id: 'p13', name: 'Green Chillies', category: 'Vegetables', image: '🌶️' },
  { id: 'p14', name: 'Orange Juice', category: 'Beverages', image: '🧃' },
  { id: 'p15', name: 'Paneer (250g)', category: 'Dairy', image: '🧀' },
];

export const vendorProducts: VendorProduct[] = [
  { id: 'vp1', product: products[0], vendor: vendors[0], price: 40, unit: 'per kg', inStock: true },
  { id: 'vp2', product: products[0], vendor: vendors[1], price: 45, unit: 'per kg', inStock: true },
  { id: 'vp3', product: products[0], vendor: vendors[4], price: 38, unit: 'per kg', inStock: true },
  { id: 'vp4', product: products[1], vendor: vendors[0], price: 30, unit: 'per kg', inStock: true },
  { id: 'vp5', product: products[1], vendor: vendors[1], price: 35, unit: 'per kg', inStock: true },
  { id: 'vp6', product: products[2], vendor: vendors[0], price: 25, unit: 'per kg', inStock: true },
  { id: 'vp7', product: products[3], vendor: vendors[2], price: 56, unit: 'per L', inStock: true },
  { id: 'vp8', product: products[3], vendor: vendors[1], price: 60, unit: 'per L', inStock: true },
  { id: 'vp9', product: products[4], vendor: vendors[2], price: 40, unit: 'per 500g', inStock: true },
  { id: 'vp10', product: products[5], vendor: vendors[3], price: 150, unit: 'per kg', inStock: false },
  { id: 'vp11', product: products[5], vendor: vendors[4], price: 160, unit: 'per kg', inStock: true },
  { id: 'vp12', product: products[6], vendor: vendors[3], price: 50, unit: 'per dozen', inStock: false },
  { id: 'vp13', product: products[6], vendor: vendors[0], price: 45, unit: 'per dozen', inStock: true },
  { id: 'vp14', product: products[7], vendor: vendors[1], price: 35, unit: 'per pack', inStock: true },
  { id: 'vp15', product: products[8], vendor: vendors[1], price: 80, unit: 'per dozen', inStock: true },
  { id: 'vp16', product: products[9], vendor: vendors[4], price: 55, unit: 'per kg', inStock: true },
  { id: 'vp17', product: products[10], vendor: vendors[1], price: 20, unit: 'per pack', inStock: true },
  { id: 'vp18', product: products[11], vendor: vendors[1], price: 30, unit: 'per pack', inStock: true },
  { id: 'vp19', product: products[12], vendor: vendors[0], price: 15, unit: 'per 100g', inStock: true },
  { id: 'vp20', product: products[13], vendor: vendors[1], price: 25, unit: 'per pack', inStock: true },
  { id: 'vp21', product: products[14], vendor: vendors[2], price: 80, unit: 'per 250g', inStock: true },
];

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return products;
  return products.filter(p =>
    p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );
}

export function getVendorsForProduct(productId: string): VendorProduct[] {
  return vendorProducts.filter(vp => vp.product.id === productId);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter(p => p.category === category);
}

export const sampleOrders: Order[] = [
  {
    id: 'ORD001',
    items: [
      { vendorProduct: vendorProducts[0], quantity: 2 },
      { vendorProduct: vendorProducts[18], quantity: 1 },
    ],
    status: 'out_for_delivery',
    total: 95,
    createdAt: '2026-03-26T10:30:00',
    vendorName: "Ramesh's Fresh Veggies",
  },
  {
    id: 'ORD002',
    items: [
      { vendorProduct: vendorProducts[6], quantity: 2 },
      { vendorProduct: vendorProducts[8], quantity: 1 },
    ],
    status: 'delivered',
    total: 152,
    createdAt: '2026-03-25T14:00:00',
    vendorName: 'Lakshmi Dairy Corner',
  },
];
