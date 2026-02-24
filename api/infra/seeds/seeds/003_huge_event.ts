import type { PoolClient } from "pg";
import type { Seed } from "../types.js";

const venue = {
  externalId: "f6596977-ff00-4e73-9851-df3f8197ea3f",
  name: "Huge Venue",
  vipSeats: 30000,
  firstRowSeats: 500000,
  gaSeats: 5000000,
};

const event = {
  externalId: "70f43f9d-2417-48e9-a870-f8fa0050ac84",
  venueExternalId: "f6596977-ff00-4e73-9851-df3f8197ea3f",
  name: "Huge Event",
  vipPrice: 100,
  firstRowPrice: 50,
  gaPrice: 10,
  eventDatetime: new Date("2026-08-01T00:00:00.000Z"),
};

const seed: Seed = {
  name: "003_huge_event",
  async run(client: PoolClient): Promise<void> {
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

    const venueResult = await client.query<{ id: string }>({
      text: `
        SELECT id::text
        FROM venue
        WHERE external_id = $1
        LIMIT 1;
      `,
      values: [event.venueExternalId],
    });

    const venueRow = venueResult.rows[0];
    if (!venueRow) {
      throw new Error(`Cannot seed ${event.name}: venue not found.`);
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
        venueRow.id,
        event.externalId,
        event.name,
        event.vipPrice,
        event.firstRowPrice,
        event.gaPrice,
        event.eventDatetime.toISOString(),
      ],
    });
  },
};

export default seed;
