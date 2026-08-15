require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Email: ', async (email) => {
  rl.question('New admin password: ', async (password) => {
    rl.close();

    if (!email || !password) {
      console.error('Email and password are required.');
      process.exit(1);
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });

    try {
      await client.connect();

      const hash = await bcrypt.hash(password, 12);

      const result = await client.query(
        `INSERT INTO admin_users (id, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, created_at`,
        [
          crypto.randomUUID(),
          email.trim().toLowerCase(),
          hash
        ]
      );

      console.log('\nSUCCESS — admin account created:');
      console.log(JSON.stringify(result.rows[0], null, 2));

      await client.end();
    } catch (error) {
      console.error('\nERROR:', error.message);
      await client.end().catch(() => {});
      process.exit(1);
    }
  });
});
