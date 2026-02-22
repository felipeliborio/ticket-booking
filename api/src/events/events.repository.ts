import { Injectable } from "@nestjs/common";
import { database } from "infra/database";
import {
  EventDatabaseRow,
  FindAllEventsOptions,
} from "src/events/events.types";

@Injectable()
export class EventsRepository {
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
}
