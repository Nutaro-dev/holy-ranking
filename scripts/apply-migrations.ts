import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const { Client } = pg;

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(`
Missing DATABASE_URL in .env.local

Get it from Supabase Dashboard → Project Settings → Database → Connection string (URI)
Use the "Transaction" pooler mode, e.g.:
  postgresql://postgres.hvzheluudpfxioxocygu:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

Then run: npm run setup-db
`);
    process.exit(1);
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('→ Connected to Postgres');

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`→ Applying ${file}…`);
    await client.query(sql);
    console.log(`  ✓ ${file}`);
  }

  await client.end();
  console.log('✓ All migrations applied');
}

main().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
