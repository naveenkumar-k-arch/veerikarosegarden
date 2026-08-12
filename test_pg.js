import { PrismaClient } from '@prisma/client';

const p = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_opY2PtxvM3If@ep-icy-paper-ahfr0utz-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15'
    }
  }
});

async function main() {
  try {
    const cols = await p.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='Order'`;
    console.log('ORDER COLUMNS:', cols);

    const rows = await p.$queryRaw`SELECT * FROM "Order" LIMIT 5`;
    console.log('SAMPLE ORDERS:', JSON.stringify(rows, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await p.$disconnect();
  }
}

main();
