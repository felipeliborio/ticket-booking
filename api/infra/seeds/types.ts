import type { PoolClient } from "pg";

export interface Seed {
  name: string;
  run: (client: PoolClient) => Promise<void>;
}
