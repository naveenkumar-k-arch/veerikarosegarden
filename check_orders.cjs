const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  try {
    const orders = await p.order.findMany();
    console.log('🎉 REAL ORDERS COUNT IN DB:', orders.length);
    if (orders.length > 0) {
      console.log('Sample Order:', orders[0]);
    }
  } catch (e) {
    console.error('Error fetching orders:', e.message);
  } finally {
    await p.$disconnect();
  }
}

run();
