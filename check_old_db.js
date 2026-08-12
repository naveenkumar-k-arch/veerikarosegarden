import { PrismaClient } from '@prisma/client';

const oldUrl = 'postgresql://neondb_owner:npg_HnvEW6BFtT0u@ep-autumn-sea-awkv2mst.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require';
const oldPoolerUrl = 'postgresql://neondb_owner:npg_HnvEW6BFtT0u@ep-autumn-sea-awkv2mst-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true';

async function testOldDb() {
  console.log('--- Testing Direct Old DB ---');
  const p1 = new PrismaClient({ datasources: { db: { url: oldUrl } } });
  try {
    const orders = await p1.order.findMany();
    console.log(`✅ Direct Old DB Success! Found ${orders.length} orders.`);
    return orders;
  } catch (e) {
    console.error('❌ Direct Old DB failed:', e.message);
  } finally {
    await p1.$disconnect();
  }

  console.log('--- Testing Pooler Old DB ---');
  const p2 = new PrismaClient({ datasources: { db: { url: oldPoolerUrl } } });
  try {
    const orders = await p2.order.findMany();
    console.log(`✅ Pooler Old DB Success! Found ${orders.length} orders.`);
    return orders;
  } catch (e) {
    console.error('❌ Pooler Old DB failed:', e.message);
  } finally {
    await p2.$disconnect();
  }
}

testOldDb();
