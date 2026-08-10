import { calculateDeliveryFee, INDIAN_STATES, isTamilNadu } from '../src/utils/delivery.js';

console.log('--- RUNNING DELIVERY FEE LOGIC TESTS ---');

const roseItem = {
  quantity: 1,
  product: { id: 'prod-rose-1', name: 'Double Delight Rose Plant', category: 'Rose Plants', tags: ['rose'] }
};

// 1. Tamil Nadu 1 plant (Expected ₹60)
const fee1 = calculateDeliveryFee([roseItem], 'Tamil Nadu');
console.log('1 Plant in Tamil Nadu:', fee1, fee1 === 60 ? '✅ PASS' : `❌ FAIL (Expected 60, got ${fee1})`);

// 2. Tamil Nadu 2 plants (Expected ₹80 -> 60 + 20)
const fee2 = calculateDeliveryFee([{ ...roseItem, quantity: 2 }], 'Tamil Nadu');
console.log('2 Plants in Tamil Nadu:', fee2, fee2 === 80 ? '✅ PASS' : `❌ FAIL (Expected 80, got ${fee2})`);

// 3. Tamil Nadu 3 plants (Expected ₹100 -> 60 + 40)
const fee3 = calculateDeliveryFee([{ ...roseItem, quantity: 3 }], 'Tamil Nadu');
console.log('3 Plants in Tamil Nadu:', fee3, fee3 === 100 ? '✅ PASS' : `❌ FAIL (Expected 100, got ${fee3})`);

// 4. Kerala 1 plant (Expected ₹100)
const fee4 = calculateDeliveryFee([roseItem], 'Kerala');
console.log('1 Plant in Kerala:', fee4, fee4 === 100 ? '✅ PASS' : `❌ FAIL (Expected 100, got ${fee4})`);

// 5. Karnataka 2 plants (Expected ₹120 -> 100 + 20)
const fee5 = calculateDeliveryFee([{ ...roseItem, quantity: 2 }], 'Karnataka');
console.log('2 Plants in Karnataka:', fee5, fee5 === 120 ? '✅ PASS' : `❌ FAIL (Expected 120, got ${fee5})`);

// 6. Andhra Pradesh 3 plants (Expected ₹140 -> 100 + 40)
const fee6 = calculateDeliveryFee([{ ...roseItem, quantity: 3 }], 'Andhra Pradesh');
console.log('3 Plants in Andhra Pradesh:', fee6, fee6 === 140 ? '✅ PASS' : `❌ FAIL (Expected 140, got ${fee6})`);

// 7. Puducherry 1 plant (Expected ₹100)
const fee7 = calculateDeliveryFee([roseItem], 'Puducherry');
console.log('1 Plant in Puducherry:', fee7, fee7 === 100 ? '✅ PASS' : `❌ FAIL (Expected 100, got ${fee7})`);

// 8. Check INDIAN_STATES count & items
console.log('INDIAN_STATES list:', INDIAN_STATES);
const isStatesOk = INDIAN_STATES.length === 5 &&
  INDIAN_STATES.includes('Tamil Nadu') &&
  INDIAN_STATES.includes('Karnataka') &&
  INDIAN_STATES.includes('Kerala') &&
  INDIAN_STATES.includes('Andhra Pradesh') &&
  INDIAN_STATES.includes('Puducherry');

console.log('State List Check (5 states only):', isStatesOk ? '✅ PASS' : '❌ FAIL');

console.log('--- ALL TESTS COMPLETED ---');
