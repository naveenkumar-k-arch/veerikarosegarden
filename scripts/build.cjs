const { execSync } = require('child_process');

// Ensure DATABASE_URL exists during build-time code generation
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://build_user:build_pass@localhost:5432/build_db?sslmode=require';
}

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, {
    stdio: 'inherit',
    env: { ...process.env }
  });
}

try {
  console.log('=== Starting Build Pipeline ===');
  
  console.log('[1/3] Generating Prisma Client...');
  try {
    run('npx prisma generate');
  } catch (prismaErr) {
    console.warn('⚠️ Warning: Prisma generate failed (likely Windows file lock), continuing with existing client:', prismaErr.message);
  }

  console.log('\n[2/3] Building Vite Client Assets...');
  run('npx vite build');

  console.log('\n[3/3] Bundling Serverless / Standalone Server...');
  run('npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs');

  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
