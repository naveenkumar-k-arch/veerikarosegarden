
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function run() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('--- LATEST ORDERS IN DATABASE ---');
  for (const o of orders) {
    console.log(`Order ID: ${o.id} | OrderNumber: ${o.orderNumber} | Customer: ${o.customerName} (${o.customerPhone}) | Amount: ₹${o.totalAmount} | Payment: ${o.paymentStatus} (${o.paymentMethod}) | Status: ${o.status} | Created: ${o.createdAt.toISOString()}`);
  }

  const logs = await prisma.paymentLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  }).catch(() => []);
  console.log('--- LATEST PAYMENT LOGS ---');
  for (const l of logs) {
    console.log(`Log ID: ${l.id} | OrderId: ${l.orderId} | TxnId: ${l.merchantTransactionId} | Amount: ₹${l.amount} | Status: ${l.status} | Checksum: ${l.checksum}`);
  }
}

run().finally(() => prisma.$disconnect());
