import { ServiceError } from "infra/errors";
import { Pool } from "pg";
import type { PoolClient, QueryConfig, QueryResult, QueryResultRow } from "pg";

export const database = {
  close,
  getNewClient,
  query,
};

export default database;

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const POOL_PARAMS = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: Number.parseInt(process.env.POSTGRES_PORT ?? "5432"),
    ssl: process.env.POSTGRES_SSL === "true",
    max: Number.parseInt(process.env.POSTGRES_POOL_MAX ?? "20"),
    idleTimeoutMillis: Number.parseInt(
      process.env.POSTGRES_POOL_IDLE_TIMEOUT_MS ?? "30000",
    ),
    connectionTimeoutMillis: Number.parseInt(
      process.env.POSTGRES_POOL_CONNECTION_TIMEOUT_MS ?? "5000",
    ),
  };

  pool = new Pool(POOL_PARAMS);
  return pool;
}

export async function getNewClient(): Promise<PoolClient> {
  return getPool().connect();
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  queryObject: string | QueryConfig,
): Promise<QueryResult<T>> {
  try {
    return await getPool().query<T>(queryObject);
  } catch (err) {
    const serviceErrorObject = new ServiceError({
      message: "Erro no banco de dados.",
      cause: err,
    });
    throw serviceErrorObject;
  }
}

export async function close(): Promise<void> {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = undefined;
}
