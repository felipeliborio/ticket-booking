import { close, getNewClient } from "../database.js";
import { loadEnvironment } from "./load-environment.js";
import type { Seed } from "./types.js";
import seedVenue from "./seeds/001_venue.js";
import seedEvent from "./seeds/002_event.js";

const availableSeeds: Seed[] = [seedVenue, seedEvent];

function parseFileArg(argv: string[]): string | undefined {
  const fileFlagIndex = argv.findIndex((arg) => arg === "--file");
  if (fileFlagIndex >= 0) {
    return argv[fileFlagIndex + 1];
  }

  const prefixedArg = argv.find((arg) => arg.startsWith("--file="));
  if (prefixedArg) {
    return prefixedArg.slice("--file=".length);
  }

  return undefined;
}

async function run(): Promise<void> {
  loadEnvironment();

  const seedName = parseFileArg(process.argv.slice(2));
  const selectedSeeds = seedName
    ? availableSeeds.filter((seed) => seed.name === seedName)
    : availableSeeds;

  if (seedName && selectedSeeds.length === 0) {
    throw new Error(
      `Unknown seed "${seedName}". Available seeds: ${availableSeeds
        .map((seed) => seed.name)
        .join(", ")}.`,
    );
  }

  const client = await getNewClient();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS seed_history (
        seed_name TEXT PRIMARY KEY,
        executed_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const executedResult = await client.query<{ seed_name: string }>({
      text: "SELECT seed_name FROM seed_history;",
    });
    const executedSeeds = new Set(
      executedResult.rows.map((row) => row.seed_name),
    );

    for (const seed of selectedSeeds) {
      if (executedSeeds.has(seed.name)) {
        console.log(`Skipping seed ${seed.name} (already executed).`);
        continue;
      }

      console.log(`Running seed ${seed.name}...`);
      await seed.run(client);
      await client.query({
        text: "INSERT INTO seed_history (seed_name) VALUES ($1);",
        values: [seed.name],
      });
      console.log(`Seed ${seed.name} completed.`);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
