const { Client } = require('pg');

const regions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'sa-east-1',
  'ca-central-1'
];

const pass = 'Umer@20841234';

async function testPoolers() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    process.stdout.write(`Testing ${region}... `);
    const client = new Client({
      host,
      port: 6543,
      user: 'postgres.qsizzlodkoocbmiudwxh',
      password: pass,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000
    });

    try {
      await client.connect();
      console.log(`\nSUCCESS! Connected via pooler in region: ${region}`);
      const res = await client.query('SELECT current_database(), current_user;');
      console.log('Result:', res.rows[0]);
      await client.end();
      return region;
    } catch (err) {
      if (err.message.includes('password authentication failed') || err.message.includes('Tenant or user not found')) {
        console.log(`auth response: ${err.message}`);
      } else {
        console.log(`failed: ${err.message}`);
      }
      try { await client.end(); } catch (e) {}
    }
  }
}

testPoolers();
