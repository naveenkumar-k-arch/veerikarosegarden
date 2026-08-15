import { CartItem } from '../types';
import { calculateDeliveryFee } from './delivery';

export interface OrderTotalsInput {
  items: CartItem[];
  state?: string;
  selectedPot?: 'NONE' | '6_INCH' | '8_INCH';
  appliedCoupon?: { code: string; discountAmount: number } | null;
}

export interface OrderTotalsOutput {
  subtotal: number;
  totalPlantCount: number;
  potUnitFee: number;
  potCharge: number;
  shippingFee: number;
  discountAmount: number;
  grandTotal: number;
}

export function computeOrderTotals({
  items,
  state = 'Tamil Nadu',
  selectedPot = 'NONE',
  appliedCoupon = null
}: OrderTotalsInput): OrderTotalsOutput {
  const subtotal = items.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
  const totalPlantCount = items.reduce((sum, i) => {
    const isCombo = i.isCombo || i.product.id.startsWith('combo-') || (i.product as any).isCombo;
    const bundleCount = (i.comboProducts && i.comboProducts.length > 0)
      ? i.comboProducts.length
      : ((i.product as any).comboProducts?.length || 1);
    return sum + (isCombo ? bundleCount * i.quantity : i.quantity);
  }, 0);

  const potUnitFee = selectedPot === '6_INCH' ? 99 : selectedPot === '8_INCH' ? 199 : 0;
  const potCharge = potUnitFee * totalPlantCount;

  // Free shipping when pot option is selected (or calculated per state)
  const shippingFee = selectedPot !== 'NONE' ? 0 : calculateDeliveryFee(items, state);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;

  const grandTotal = Math.max(0, subtotal + potCharge + shippingFee - discountAmount);

  return {
    subtotal,
    totalPlantCount,
    potUnitFee,
    potCharge,
    shippingFee,
    discountAmount,
    grandTotal
  };
}
