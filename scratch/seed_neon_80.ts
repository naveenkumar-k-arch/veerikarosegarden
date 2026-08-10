import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), 'scratch', 'new_80_products.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const products = JSON.parse(rawData);

  console.log(`Seeding ${products.length} products to Neon PostgreSQL...`);

  let insertedCount = 0;
  for (const p of products) {
    try {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          nameTamil: p.nameTamil,
          scientificName: p.scientificName,
          category: p.category,
          categoryId: p.categoryId,
          price: p.price,
          originalPrice: p.originalPrice,
          rating: p.rating,
          reviewsCount: p.reviewsCount,
          image: p.image,
          images: p.images,
          inStock: p.inStock,
          potSize: p.potSize,
          bloomType: p.bloomType,
          fragrance: p.fragrance,
          careSunlight: p.careSunlight,
          careWatering: p.careWatering,
          careSoil: p.careSoil,
          careFertilizer: p.careFertilizer,
          description: p.description,
          isBestSeller: p.isBestSeller,
          isFeatured: p.isFeatured,
          sku: p.sku
        },
        create: {
          id: p.id,
          sku: p.sku,
          name: p.name,
          nameTamil: p.nameTamil,
          scientificName: p.scientificName,
          category: p.category,
          categoryId: p.categoryId,
          price: p.price,
          originalPrice: p.originalPrice,
          rating: p.rating,
          reviewsCount: p.reviewsCount,
          image: p.image,
          images: p.images,
          inStock: p.inStock,
          potSize: p.potSize,
          bloomType: p.bloomType,
          fragrance: p.fragrance,
          careSunlight: p.careSunlight,
          careWatering: p.careWatering,
          careSoil: p.careSoil,
          careFertilizer: p.careFertilizer,
          description: p.description,
          isBestSeller: p.isBestSeller,
          isFeatured: p.isFeatured
        }
      });
      
      // Also ensure inventory record exists
      await prisma.inventory.upsert({
        where: { productId: p.id },
        update: { quantity: 150 },
        create: { productId: p.id, quantity: 150 }
      });

      insertedCount++;
    } catch (err) {
      console.error(`Error inserting ${p.id} (${p.name}):`, err);
    }
  }

  const totalCount = await prisma.product.count();
  console.log(`Success! Inserted/updated ${insertedCount} products. Total products in Neon PostgreSQL DB: ${totalCount}`);
}

main()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
