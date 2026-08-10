import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Purging all existing combos from database...');
  const res = await prisma.combo.deleteMany();
  console.log(`✅ Deleted ${res.count} combos from PostgreSQL database.`);
}

main()
  .catch(err => {
    console.error('Error purging combos:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
