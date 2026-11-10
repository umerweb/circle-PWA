const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const dbPass = process.env.db_pass || 'Umer@20841234';
const host = process.env.DB_HOST || 'aws-1-ap-south-1.pooler.supabase.com';
const port = parseInt(process.env.DB_PORT || '5432');
const user = process.env.DB_USER || 'postgres.qsizzlodkoocbmiudwxh';
const database = process.env.DB_NAME || 'postgres';

async function migrate() {
  console.log(`Connecting to ${host}:${port} as ${user}...`);
  const client = new Client({
    host,
    port,
    user,
    password: dbPass,
    database,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully.');

    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying database schema migration...');
    await client.query(sql);
    console.log('Migration completed successfully!');

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Public tables in database:', res.rows.map(r => r.table_name));

    await client.end();
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
