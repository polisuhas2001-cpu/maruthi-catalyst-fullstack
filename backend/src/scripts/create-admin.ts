import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { pool } from '../config/db.js';
import { authService } from '../services/auth.service.js';

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const email = (await rl.question('Admin email: ')).trim().toLowerCase();
    const password = await rl.question('Admin password (min 12 chars): ');

    if (!email.includes('@')) {
      throw new Error('That does not look like a valid email address.');
    }
    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters.');
    }

    const passwordHash = await authService.hashPassword(password);

    await pool.query(
      `INSERT INTO admin_users (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [email, passwordHash],
    );

    console.log(`Admin user ready: ${email}`);
  } finally {
    rl.close();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
