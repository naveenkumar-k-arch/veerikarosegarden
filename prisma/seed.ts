import { PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production database initialization...');

  // 1. Seed Super Admin User dynamically from environment variables
  const adminEmail = (process.env.ADMIN_INITIAL_EMAIL || 'nv01110612@gmail.com').toLowerCase();
  const rawPassword = process.env.ADMIN_INITIAL_PASSWORD || 'nv01110612@gmail.com';
  const passwordHash = await argon2.hash(rawPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: Role.SUPER_ADMIN,
      isVerified: true
    },
    create: {
      email: adminEmail,
      phone: '09360931606',
      name: 'Super Admin',
      passwordHash,
      role: Role.SUPER_ADMIN,
      isVerified: true
    }
  });

  console.log(`✅ Production Super Admin configured: ${adminUser.email}`);

  // 2. Seed Default Production Site Settings
  await prisma.siteSetting.upsert({
    where: { id: 'default' },
    update: {
      businessName: process.env.BUSINESS_NAME || 'Veerika Rose Garden',
      tagline: process.env.BUSINESS_TAGLINE || 'Premier Plant Nursery & Farm Direct Gardens',
      phone: process.env.BUSINESS_PHONE || '+91 72008 26129',
      email: process.env.BUSINESS_EMAIL || 'support@veerikarosegarden.com',
      whatsapp: process.env.BUSINESS_WHATSAPP || '+917200826129',
      address: process.env.BUSINESS_ADDRESS || 'Hosur & Madurai Nursery Road, Tamil Nadu, India',
      googleMapsUrl: process.env.BUSINESS_MAPS_URL || 'https://maps.google.com',
      workingHours: 'Mon - Sun: 7:00 AM - 8:00 PM',
      taxRate: 5,
      shippingFee: 50,
      freeShippingThreshold: 499,
      phonepeMerchantId: process.env.PHONEPE_MERCHANT_ID || '',
      phonepeSaltKey: process.env.PHONEPE_SALT_KEY || '',
      phonepeSaltIndex: process.env.PHONEPE_SALT_INDEX || '1',
      phonepeEnv: (process.env.PHONEPE_ENV as string) || 'PRODUCTION'
    },
    create: {
      id: 'default',
      businessName: process.env.BUSINESS_NAME || 'Veerika Rose Garden',
      tagline: process.env.BUSINESS_TAGLINE || 'Premier Plant Nursery & Farm Direct Gardens',
      phone: process.env.BUSINESS_PHONE || '+91 72008 26129',
      email: process.env.BUSINESS_EMAIL || 'support@veerikarosegarden.com',
      whatsapp: process.env.BUSINESS_WHATSAPP || '+917200826129',
      address: process.env.BUSINESS_ADDRESS || 'Hosur & Madurai Nursery Road, Tamil Nadu, India',
      googleMapsUrl: process.env.BUSINESS_MAPS_URL || 'https://maps.google.com',
      workingHours: 'Mon - Sun: 7:00 AM - 8:00 PM',
      taxRate: 5,
      shippingFee: 50,
      freeShippingThreshold: 499,
      phonepeMerchantId: process.env.PHONEPE_MERCHANT_ID || '',
      phonepeSaltKey: process.env.PHONEPE_SALT_KEY || '',
      phonepeSaltIndex: process.env.PHONEPE_SALT_INDEX || '1',
      phonepeEnv: (process.env.PHONEPE_ENV as string) || 'PRODUCTION'
    }
  });
  console.log('✅ Default Site Settings initialized.');
  console.log('🎉 Production database setup completed cleanly (no demo products/reviews)!');
}

main()
  .catch((e) => {
    console.error('❌ Error during setup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
