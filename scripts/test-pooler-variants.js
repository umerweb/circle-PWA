const { Client } = require('pg');

const pass = 'Umer@20841234';
const host = 'aws-0-ap-south-1.pooler.supabase.com';

const configs = [
  { port: 5432, user: 'postgres.qsizzlodkoocbmiudwxh' },
  { port: 6543, user: 'postgres.qsizzlodkoocbmiudwxh' },
  { port: 5432, user: 'postgres' },
  { port: 6543, user: 'postgres' },
  { port: 5432, user: 'qsizzlodkoocbmiudwxh' },
  { port: 6543, user: 'qsizzlodkoocbmiudwxh' },
];

async function test() {
  for (const c of configs) {
    console.log(`Testing port ${c.port} with user ${c.user}...`);
    const client = new Client({
      host,
      port: c.port,
      user: c.user,
      password: pass,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    try {
      await client.connect();
      console.log(`SUCCESS with port ${c.port} and user ${c.user}!`);
      const res = await client.query('SELECT 1;');
      console.log('Query result:', res.rows);
      await client.end();
      return;
    } catch (e) {
      console.log(`Result: ${e.message}`);
      try { await client.end(); } catch (err) {}
    }
  }
}

test();
