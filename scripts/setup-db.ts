/**
 * Apply SQL migrations + seed all HOLY products with real Shopify images.
 * Requires DATABASE_URL in .env.local for migrations.
 */
import { execSync } from 'child_process';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

async function main() {
  console.log('=== Holy Ranking DB Setup ===\n');

  if (process.env.DATABASE_URL) {
    execSync('tsx scripts/apply-migrations.ts', { stdio: 'inherit' });
  } else {
    console.warn(
      '⚠ DATABASE_URL not set — skipping migrations.\n' +
        '  If tables are missing, add DATABASE_URL to .env.local and re-run.\n' +
        '  Or paste supabase/cloud-setup.sql into Supabase SQL Editor.\n',
    );
  }

  execSync('tsx scripts/seed-products.ts', { stdio: 'inherit' });
}

main();
