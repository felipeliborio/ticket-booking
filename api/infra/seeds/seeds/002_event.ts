import type { Client } from "pg";
import type { Seed } from "../types.js";

function deterministicUuid(seed: number): string {
  return `00000000-0000-4000-8000-${seed.toString(16).padStart(12, "0")}`;
}

const venueExternalIds = Array.from({ length: 10 }, (_, index) =>
  deterministicUuid(index + 1),
);

const baseDatetime = new Date("2026-06-01T00:00:00.000Z");

const events = Array.from({ length: 200 }, (_, index) => {
  const eventNumber = index + 1;
  const venueIndex = index % venueExternalIds.length;
  const eventDatetime = new Date(
    baseDatetime.getTime() + index * 6 * 60 * 60 * 1000,
  );

  return {
    externalId: deterministicUuid(1000 + eventNumber),
    venueExternalId: venueExternalIds[venueIndex],
    name: `Event ${eventNumber}`,
    vipPrice: 100,
    firstRowPrice: 50,
    gaPrice: 10,
    eventDatetime: eventDatetime.toISOString(),
  };
});

const seed: Seed = {
  name: "002_event",
  async run(client: Client): Promise<void> {
    for (const event of events) {
      const venueResult = await client.query<{ id: string }>({
        text: `
          SELECT id::text
          FROM venue
          WHERE external_id = $1
          LIMIT 1;
        `,
        values: [event.venueExternalId],
      });

      const venue = venueResult.rows[0];
      if (!venue) {
        throw new Error(
          `Cannot seed ${event.name}: venue ${event.venueExternalId} not found.`,
        );
      }

      await client.query({
        text: `
          INSERT INTO event (
            venue_id,
            external_id,
            name,
            vip_price,
            first_row_price,
            ga_price,
            event_datetime
          )
          SELECT $1::int8, $2, $3, $4::numeric(10,4), $5::numeric(10,4), $6::numeric(10,4), $7::timestamptz
          WHERE NOT EXISTS (
            SELECT 1
            FROM event
            WHERE external_id = $2
          );
        `,
        values: [
          venue.id,
          event.externalId,
          event.name,
          event.vipPrice,
          event.firstRowPrice,
          event.gaPrice,
          event.eventDatetime,
        ],
      });
    }
  },
};

export default seed;
