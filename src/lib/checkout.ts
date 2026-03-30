import type { CartItem, PaymentMethod } from '@/lib/mock-data';

const CHECKOUT_STORAGE_KEY = 'localkart-checkout';

export type CheckoutSession = {
  createdAt: string;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
};

type MockPaymentOptions = {
  delayMs?: number;
  shouldSucceed: boolean;
};

export function calculateCartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.vendorProduct.price * item.quantity, 0);
}

export function groupCartItemsByVendor(items: CartItem[]) {
  return items.reduce((groups, item) => {
    const vendorId = item.vendorProduct.vendor.id;
    const existingGroup = groups.get(vendorId) ?? [];
    existingGroup.push(item);
    groups.set(vendorId, existingGroup);
    return groups;
  }, new Map<string, CartItem[]>());
}

export function saveCheckoutSession(session: CheckoutSession) {
  window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(session));
}

export function getCheckoutSession() {
  const rawValue = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as CheckoutSession;
  } catch (error) {
    console.error('[checkout] Failed to parse checkout session', error);
    clearCheckoutSession();
    return null;
  }
}

export function clearCheckoutSession() {
  window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
}

export async function simulateMockPayment({ delayMs = 2200, shouldSucceed }: MockPaymentOptions) {
  await new Promise((resolve) => window.setTimeout(resolve, delayMs));

  if (!shouldSucceed) {
    throw new Error('Payment failed. Please verify your details or choose Cash on Delivery.');
  }

  return {
    paidAt: new Date().toISOString(),
    paymentMethod: 'online' as PaymentMethod,
    reference: `mock_${crypto.randomUUID()}`,
  };
}
