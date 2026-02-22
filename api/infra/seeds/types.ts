import type { Client } from "pg";

export interface Seed {
  name: string;
  run: (client: Client) => Promise<void>;
}
