import { Injectable } from "@nestjs/common";
import { database } from "infra/database";
import {
  EventAvailabilityRow,
  EventDatabaseRow,
  FindAllEventsOptions,
} from "src/events/events.types";

@Injectable()
export class EventsRepository {
  async findInternalIdByExternalId(
    externalId: string,
  ): Promise<number | undefined> {
    const queryResult = await database.query<{ id: string }>({
      text: `
        SELECT id::text
        FROM event
        WHERE external_id = $1
        LIMIT 1;
      `,
      values: [externalId],
    });

    const row = queryResult.rows[0];
    return row ? Number.parseInt(row.id, 10) : undefined;
  }

  async findAll(options: FindAllEventsOptions): Promise<EventDatabaseRow[]> {
    const values: Array<string | number> = [];
    const whereClauses: string[] = [];

    if (typeof options.name === "string" && options.name.trim().length > 0) {
      values.push(`%${options.name.trim()}%`);
      whereClauses.push(`e.name ILIKE $${values.length}`);
    }

    if (options.cursor) {
      values.push(options.cursor.eventDatetime);
      values.push(options.cursor.externalId);
      whereClauses.push(
        `(e.event_datetime, e.external_id) > ($${values.length - 1}::timestamptz, $${values.length}::uuid)`,
      );
    }

    values.push(options.limit);
    const where =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const queryResult = await database.query<EventDatabaseRow>({
      text: `
        SELECT
          e.external_id,
          v.external_id AS venue_external_id,
          v.name AS venue_name,
          e.name,
          e.vip_price::text,
          e.first_row_price::text,
          e.ga_price::text,
          e.event_datetime,
          e.created_at,
          e.updated_at
        FROM event e
        INNER JOIN venue v ON v.id = e.venue_id
        ${where}
        ORDER BY e.event_datetime ASC, e.external_id ASC
        LIMIT $${values.length};
      `,
      values,
    });

    return queryResult.rows;
  }

  async findByExternalId(
    externalId: string,
  ): Promise<EventDatabaseRow | undefined> {
    const queryResult = await database.query<EventDatabaseRow>({
      text: `
        SELECT
          e.external_id,
          v.external_id AS venue_external_id,
          v.name AS venue_name,
          e.name,
          e.vip_price::text,
          e.first_row_price::text,
          e.ga_price::text,
          e.event_datetime,
          e.created_at,
          e.updated_at
        FROM event e
        INNER JOIN venue v ON v.id = e.venue_id
        WHERE e.external_id = $1;
      `,
      values: [externalId],
    });

    return queryResult.rows[0];
  }

  async findAvailabilityByExternalId(
    externalId: string,
  ): Promise<EventAvailabilityRow | undefined> {
    const queryResult = await database.query<EventAvailabilityRow>({
      text: `
        WITH availability AS (
          SELECT
            e.external_id AS event_external_id,
            GREATEST(
              v.vip_seats - COALESCE(SUM(b.vip_seats) FILTER (
                WHERE b.status IN ('pending', 'success')
              ), 0)::int,
              0
            )::int AS vip_available,
            GREATEST(
              v.first_row_seats - COALESCE(SUM(b.first_row_seats) FILTER (
                WHERE b.status IN ('pending', 'success')
              ), 0)::int,
              0
            )::int AS first_row_available,
            GREATEST(
              v.ga_seats - COALESCE(SUM(b.ga_seats) FILTER (
                WHERE b.status IN ('pending', 'success')
              ), 0)::int,
              0
            )::int AS ga_available
          FROM event e
          INNER JOIN venue v ON v.id = e.venue_id
          LEFT JOIN booking b ON b.event_id = e.id
          WHERE e.external_id = $1
          GROUP BY e.external_id, v.vip_seats, v.first_row_seats, v.ga_seats
        )
        SELECT
          event_external_id,
          vip_available,
          first_row_available,
          ga_available,
          (vip_available + first_row_available + ga_available)::int AS total_available
        FROM availability;
      `,
      values: [externalId],
    });

    return queryResult.rows[0];
  }
}
