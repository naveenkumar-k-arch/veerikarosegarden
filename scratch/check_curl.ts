import { db } from '../src/server/db.js';
import fs from 'fs';

async function check() {
  const reviews = await db.getReviews();
  console.log('API /api/reviews Output:', JSON.stringify(reviews, null, 2));
  console.log('Total Reviews Count:', reviews.length);
  const disk = fs.readFileSync('src/data/reviews_store.json', 'utf-8');
  console.log('Disk File Content:', disk.trim());
}

check().catch(console.error);
