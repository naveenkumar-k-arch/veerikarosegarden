import { db } from '../src/server/db.js';
import fs from 'fs';
import path from 'path';

async function runTest() {
  console.log('=== STEP 1: Fetch initial reviews from db ===');
  const initial = await db.getReviews();
  console.log('Initial Reviews count:', initial.length);
  console.log('Initial Review IDs:', initial.map(r => r.id));

  const targetId = 'rev-1';
  console.log(`\n=== STEP 2: Deleting review '${targetId}' via db.deleteReview() ===`);
  await db.deleteReview(targetId);

  console.log('\n=== STEP 3: Fetching reviews from db after delete ===');
  const afterDelete = await db.getReviews();
  console.log('Post-delete Reviews count:', afterDelete.length);
  console.log('Post-delete Review IDs:', afterDelete.map(r => r.id));
  const existsInMem = afterDelete.some(r => r.id === targetId);
  console.log(`Does '${targetId}' exist in db output?`, existsInMem);

  console.log('\n=== STEP 4: Inspecting disk database file src/data/reviews_store.json ===');
  const diskPath = path.resolve(process.cwd(), 'src/data/reviews_store.json');
  if (fs.existsSync(diskPath)) {
    const raw = fs.readFileSync(diskPath, 'utf-8');
    const diskParsed = JSON.parse(raw);
    console.log('Disk File Reviews count:', diskParsed.length);
    console.log('Disk File Review IDs:', diskParsed.map((r: any) => r.id));
    const existsOnDisk = diskParsed.some((r: any) => r.id === targetId);
    console.log(`Does '${targetId}' exist on disk?`, existsOnDisk);
  } else {
    console.log('ERROR: disk database file does not exist!');
  }

  if (!existsInMem && !afterDelete.some(r => r.id === targetId)) {
    console.log('\n🎉 SUCCESS: Review was permanently deleted from DB & Disk!');
  } else {
    console.error('\n❌ FAILURE: Review still exists!');
  }
}

runTest().catch(console.error);
