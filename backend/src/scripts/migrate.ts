import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../../db/schema.sql');

async function main() {
  const sql = readFileSync(schemaPath, 'utf-8');
  console.log(`Applying schema from ${schemaPath} ...`);
  await pool.query(sql);
  console.log('Schema applied successfully.');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
