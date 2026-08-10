import { getPrismaClient } from '../src/server/prisma.js';

async function updateCategoryImagesInDb() {
  const prisma = getPrismaClient();
  if (!prisma) {
    console.log('Prisma client not connected');
    return;
  }

  console.log('Updating Category images in database with real plant photos...');

  try {
    // 1. Update Rose Varieties
    await prisma.category.updateMany({
      where: {
        OR: [
          { id: 'cat-rose' },
          { slug: 'rose-varieties' },
          { name: { contains: 'Rose Varieties', mode: 'insensitive' } }
        ]
      },
      data: { image: '/products/double-delight.jpeg' }
    });

    // 2. Update Herbal Plants
    await prisma.category.updateMany({
      where: {
        OR: [
          { id: 'cat-herbals' },
          { slug: 'herbals' },
          { name: { contains: 'Herbal', mode: 'insensitive' } }
        ]
      },
      data: { image: '/products/ww.jpeg' }
    });

    // 3. Update Jasmine Varieties
    await prisma.category.updateMany({
      where: {
        OR: [
          { id: 'cat-jasmine' },
          { slug: 'jasmine-varieties' }
        ]
      },
      data: { image: '/products/sgssg.jpeg' }
    });

    // 4. Update Creeper Roses
    await prisma.category.updateMany({
      where: {
        OR: [
          { id: 'cat-creeper' },
          { slug: 'creeper-roses' }
        ]
      },
      data: { image: '/products/white-creeper.jpeg' }
    });

    // 5. Update Miniature Roses
    await prisma.category.updateMany({
      where: {
        OR: [
          { id: 'cat-miniature' },
          { slug: 'miniature-roses' }
        ]
      },
      data: { image: '/products/button-rose.jpeg' }
    });

    // 6. Update Rare & Exotic Roses
    await prisma.category.updateMany({
      where: {
        OR: [
          { id: 'cat-rare' },
          { slug: 'rare-exotic-roses' }
        ]
      },
      data: { image: '/products/rejtrjtj.jpeg' }
    });

    // 7. Update Fruit Plants
    await prisma.category.updateMany({
      where: {
        OR: [
          { id: 'cat-fruits' },
          { slug: 'fruit-plants' }
        ]
      },
      data: { image: '/products/red-water-apple.jpeg' }
    });

    // Replace any remaining AI generated category image paths
    await prisma.category.updateMany({
      where: {
        OR: [
          { image: { contains: 'rose-varieties-cat' } },
          { image: { contains: 'herbal-plants-cat' } }
        ]
      },
      data: { image: '/products/double-delight.jpeg' }
    });

    console.log('✅ Successfully updated all category images with real photos in database!');
  } catch (err) {
    console.error('Error updating category images:', err);
  }
}

updateCategoryImagesInDb();
