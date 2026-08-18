import { db } from '../src/server/db.js';

async function testGetOrders() {
  const start = Date.now();
  const orders = await db.getOrders();
  const duration = Date.now() - start;

  console.log(`Fetched ${orders.length} orders in ${duration}ms!`);
  orders.forEach((o, i) => {
    console.log(`${i+1}. [${o.id || o.orderNumber}] ${o.customerName} (${o.customerPhone}) - ₹${o.grandTotal} - ${o.paymentMethod} - Status: ${o.orderStatus} / ${o.paymentStatus} - Items: ${o.items?.length || 0}`);
  });
}

testGetOrders();
