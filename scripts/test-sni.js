const { Client } = require('pg');

const pass = 'Umer@20841234';

async function testSni() {
  const configs = [
    { servername: 'db.qsizzlodkoocbmiudwxh.supabase.co', user: 'postgres' },
    { servername: 'db.qsizzlodkoocbmiudwxh.supabase.co', user: 'postgres.qsizzlodkoocbmiudwxh' },
    { servername: 'qsizzlodkoocbmiudwxh.supabase.co', user: 'postgres' },
  ];

  for (const c of configs) {
    console.log(`Testing SNI ${c.servername} with user ${c.user}...`);
    const client = new Client({
      host: 'aws-0-ap-south-1.pooler.supabase.com',
      port: 5432,
      user: c.user,
      password: pass,
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false,
        servername: c.servername
      },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`SUCCESS! Connected via SNI ${c.servername}!`);
      const res = await client.query('SELECT current_database(), current_user, version();');
      console.log('Query result:', res.rows[0]);
      await client.end();
      return;
    } catch (e) {
      console.log(`Result: ${e.message}`);
      try { await client.end(); } catch (err) {}
    }
  }
}

testSni();
