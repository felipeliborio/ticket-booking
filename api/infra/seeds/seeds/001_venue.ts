import type { PoolClient } from "pg";
import type { Seed } from "../types.js";

function deterministicUuid(seed: number): string {
  return `00000000-0000-4000-8000-${seed.toString(16).padStart(12, "0")}`;
}

const venues = Array.from({ length: 10 }, (_, index) => {
  const venueNumber = index + 1;

  return {
    externalId: deterministicUuid(venueNumber),
    name: `Venue ${venueNumber}`,
    vipSeats: 200 + venueNumber * 20,
    firstRowSeats: 350 + venueNumber * 30,
    gaSeats: 7000 + venueNumber * 500,
  };
});

const seed: Seed = {
  name: "001_venue",
  async run(client: PoolClient): Promise<void> {
    for (const venue of venues) {
      await client.query({
        text: `
          INSERT INTO venue (
            external_id,
            name,
            vip_seats,
            first_row_seats,
            ga_seats
          )
          SELECT $1, $2, $3, $4, $5
          WHERE NOT EXISTS (
            SELECT 1
            FROM venue
            WHERE external_id = $1
          );
        `,
        values: [
          venue.externalId,
          venue.name,
          venue.vipSeats,
          venue.firstRowSeats,
          venue.gaSeats,
        ],
      });
    }
  },
};

export default seed;
