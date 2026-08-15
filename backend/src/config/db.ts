import { Pool } from 'pg';
import { env } from './env.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Hosted Postgres (Supabase, RDS, etc.) requires TLS; this accepts the
  // provider's certificate chain without requiring a locally pinned CA.
  ssl: env.isProduction ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  // A background/idle client error should never crash the process.
  console.error('Unexpected database pool error:', err.message);
});
