import { PrismaClient } from '@prisma/client';

const neonUrl = process.env.NEON_DATABASE_URL || '';
const supabaseUrl = process.env.DATABASE_URL || '';

if (!neonUrl || !supabaseUrl) {
  console.error('❌ Error: Both NEON_DATABASE_URL and DATABASE_URL must be defined in environment variables.');
  process.exit(1);
}

const neonDb = new PrismaClient({
  datasources: { db: { url: neonUrl } }
});

const supabaseDb = new PrismaClient({
  datasources: { db: { url: supabaseUrl } }
});

async function main() {
  console.log('📦 Attempting to read orders from Neon database...');
  try {
    const orders = await neonDb.order.findMany({
      include: {
        items: true,
        payments: true
      }
    });

    console.log(`Found ${orders.length} orders in Neon DB!`);
    if (orders.length === 0) {
      console.log('No orders found in Neon DB.');
      return;
    }

    console.log(`\n🚀 Migrating ${orders.length} orders to Supabase...`);
    let migratedCount = 0;

    for (const order of orders) {
      const { items, payments, ...orderData } = order;

      try {
        await supabaseDb.order.upsert({
          where: { id: order.id },
          update: {},
          create: {
            ...orderData,
            items: {
              create: items.map(item => ({
                id: item.id,
                productId: item.productId,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
                createdAt: item.createdAt
              }))
            }
          }
        });
        migratedCount++;
      } catch (err: any) {
        console.error(`Failed to migrate order ${order.orderNumber || order.id}:`, err.message);
      }
    }

    console.log(`✅ Successfully migrated ${migratedCount} / ${orders.length} orders to Supabase!`);
  } catch (err: any) {
    console.error('❌ Neon query error:', err.message);
  } finally {
    await neonDb.$disconnect();
    await supabaseDb.$disconnect();
  }
}

main();
