const { Client } = require('pg');

const dbPass = process.env.db_pass || 'Umer@20841234';
const encodedPass = encodeURIComponent(dbPass);
const connectionString = process.env.DATABASE_URL || `postgresql://postgres:${encodedPass}@db.qsizzlodkoocbmiudwxh.supabase.co:5432/postgres`;

console.log('Testing connection to Supabase PostgreSQL at db.qsizzlodkoocbmiudwxh.supabase.co...');

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Successfully connected to Supabase PostgreSQL!');
    const res = await client.query('SELECT current_database(), version(), current_timestamp;');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
}

run();
