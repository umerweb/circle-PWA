import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (pool) return pool;

  const dbPass = process.env.db_pass || 'Umer@20841234';
  const encodedPass = encodeURIComponent(dbPass);

  // If DATABASE_URL is provided, use it. Otherwise, default to the verified Supabase pooler host.
  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://postgres.qsizzlodkoocbmiudwxh:${encodedPass}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`;

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });

  return pool;
}

export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> {
  const p = getDbPool();
  return p.query<R>(text, params);
}

export async function getClient(): Promise<PoolClient> {
  const p = getDbPool();
  return p.connect();
}
