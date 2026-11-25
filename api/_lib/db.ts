import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { getDatabaseUrl } from './env.js';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: Number(process.env.PG_POOL_MAX) || 2,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });
    pool.on('error', (err) => {
      console.error('[PG POOL ERROR]', err);
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

/**
 * Executes multiple queries atomically inside a PostgreSQL transaction.
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Executes a PostgreSQL transaction scoped to an authenticated user via
 * `app.current_user_id` so FORCE ROW LEVEL SECURITY policies apply automatically.
 */
export async function withUserTransaction<T>(
  userId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  return withTransaction(async (client) => {
    await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
    return fn(client);
  });
}
