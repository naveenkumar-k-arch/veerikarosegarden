import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function clean() {
  console.log('🧹 Purging all demo data including categories from the database...');

  try {
    const deletedInventory = await prisma.inventory.deleteMany({});
    console.log(`- Deleted ${deletedInventory.count} inventory records.`);

    const deletedReviews = await prisma.review.deleteMany({});
    console.log(`- Deleted ${deletedReviews.count} review records.`);

    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`- Deleted ${deletedProducts.count} product records.`);

    const deletedCategories = await prisma.category.deleteMany({});
    console.log(`- Deleted ${deletedCategories.count} category records.`);

    const deletedCoupons = await prisma.coupon.deleteMany({});
    console.log(`- Deleted ${deletedCoupons.count} coupon records.`);

    const deletedBanners = await prisma.banner.deleteMany({});
    console.log(`- Deleted ${deletedBanners.count} banner records.`);

    console.log('✅ Demo data & seed categories purge completed successfully! Your store is 100% clean for production.');
  } catch (err) {
    console.error('❌ Error during data cleanup:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
