import { ServiceError } from "infra/errors";
import { Client } from "pg";
import type { QueryConfig, QueryResult, QueryResultRow } from "pg";

export const database = {
  getNewClient,
  query,
};

export default database;

export async function getNewClient(): Promise<Client> {
  const CLIENT_PARAMS = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: Number.parseInt(process.env.POSTGRES_PORT ?? "5432"),
    ssl: process.env.POSTGRES_SSL === "true",
  };

  const client = new Client(CLIENT_PARAMS);
  await client.connect();
  return client;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  queryObject: string | QueryConfig,
): Promise<QueryResult<T>> {
  let client: Client | undefined;

  try {
    client = await getNewClient();
    return await client.query<T>(queryObject);
  } catch (err) {
    const serviceErrorObject = new ServiceError({
      message: "Erro no banco de dados.",
      cause: err,
    });
    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
}
