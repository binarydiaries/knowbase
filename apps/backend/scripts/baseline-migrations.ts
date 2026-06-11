/**
 * One-time baseline: marks all previously-applied migrations in __drizzle_migrations
 * so that db:migrate only runs NEW migrations (like the workflows tables).
 *
 * Use this when the DB was built with db:push (bypassing the migrations system).
 *
 * Run once: bun run scripts/baseline-migrations.ts
 */

import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const { Client } = pg;

// The one migration we want drizzle to actually run — leave this OUT of the baseline
const SKIP = '20260601183627_complex_eddie_brock';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const migrationsDir = path.join(process.cwd(), 'drizzle');
  const folders = fs
    .readdirSync(migrationsDir)
    .filter((f) => f !== SKIP && fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort();

  console.log(`Baselining ${folders.length} migration(s)...`);

  for (const folder of folders) {
    const folderPath = path.join(migrationsDir, folder);

    // Try to read the snapshot ID (drizzle's "hash")
    let hash: string;
    const snapshotPath = path.join(folderPath, 'snapshot.json');
    if (fs.existsSync(snapshotPath)) {
      const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      hash = snapshot.id ?? crypto.randomUUID();
    } else {
      // Hand-written migration — generate a stable UUID from the folder name
      hash = crypto.createHash('md5').update(folder).digest('hex');
      hash = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
    }

    // Check if already recorded
    const existing = await client.query(
      'SELECT id FROM public."__drizzle_migrations" WHERE name = $1',
      [folder],
    );
    if (existing.rows.length > 0) {
      console.log(`  ⏭  ${folder} — already recorded, skipping`);
      continue;
    }

    await client.query(
      'INSERT INTO public."__drizzle_migrations" (hash, created_at, name, applied_at) VALUES ($1, $2, $3, NOW())',
      [hash, Date.now(), folder],
    );
    console.log(`  ✓  ${folder}`);
  }

  await client.end();
  console.log('\nDone. Now run: bun run db:migrate');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
