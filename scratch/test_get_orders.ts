import { db } from '../src/server/db.js';

async function testGetOrders() {
  console.log('=== TEST: Fetching all orders from db.getOrders() ===');
  const orders = await db.getOrders();
  console.log(`Total orders returned from database: ${orders.length}`);
  
  orders.slice(0, 10).forEach((o, idx) => {
    console.log(`${idx + 1}. [${o.id}] - ${o.customerName} (${o.customerPhone}) - Method: ${o.paymentMethod} - Status: ${o.orderStatus} / ${o.paymentStatus} - Total: ₹${o.grandTotal}`);
  });

  if (orders.length >= 28) {
    console.log('✅ SUCCESS: All 28 orders are present and persisted in database store!');
  } else {
    console.warn(`⚠️ WARNING: Expected 28 orders, but found ${orders.length}`);
  }
}

testGetOrders().catch(err => {
  console.error('Test error:', err);
});
