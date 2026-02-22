import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventResponseDto } from "src/events/dto/event-response.dto";
import { ListEventsQueryDto } from "src/events/dto/list-events-query.dto";
import { ListEventsResponseDto } from "src/events/dto/list-events-response.dto";
import { EventsRepository } from "src/events/events.repository";
import { EventDatabaseRow } from "src/events/events.types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async findAll(query: ListEventsQueryDto): Promise<ListEventsResponseDto> {
    const limit = this.parseLimit(query.limit);
    const cursor = this.parseCursor(query.cursor);

    const rows = await this.eventsRepository.findAll({
      name: query.name,
      limit: limit + 1,
      cursor,
    });

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const events = pageRows.map((row) => this.mapRowToResponse(row));

    return {
      events,
      limit,
      found: events.length,
      hasMore,
      nextCursor: hasMore
        ? this.createCursor(pageRows[pageRows.length - 1])
        : null,
    };
  }

  async findOne(id: string): Promise<EventResponseDto> {
    const row = await this.eventsRepository.findByExternalId(id);

    if (!row) {
      throw new NotFoundException("Event not found.");
    }

    return this.mapRowToResponse(row);
  }

  private parseLimit(limitQuery?: string): number {
    if (!limitQuery) {
      return DEFAULT_LIMIT;
    }

    const limit = Number.parseInt(limitQuery, 10);

    if (Number.isNaN(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new BadRequestException(
        `Invalid limit. Expected an integer between 1 and ${MAX_LIMIT}.`,
      );
    }

    return limit;
  }

  private parseCursor(
    cursorQuery?: string,
  ): { eventDatetime: string; externalId: string } | undefined {
    if (!cursorQuery) {
      return undefined;
    }

    try {
      const decoded = Buffer.from(cursorQuery, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded) as {
        eventDatetime?: string;
        externalId?: string;
      };

      if (!parsed.eventDatetime || !parsed.externalId) {
        throw new Error("Missing cursor fields");
      }

      const date = new Date(parsed.eventDatetime);
      if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid cursor datetime");
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(parsed.externalId)) {
        throw new Error("Invalid cursor uuid");
      }

      return {
        eventDatetime: date.toISOString(),
        externalId: parsed.externalId,
      };
    } catch {
      throw new BadRequestException("Invalid cursor.");
    }
  }

  private createCursor(row: EventDatabaseRow): string {
    return Buffer.from(
      JSON.stringify({
        eventDatetime: row.event_datetime.toISOString(),
        externalId: row.external_id,
      }),
    ).toString("base64");
  }

  private mapRowToResponse(row: EventDatabaseRow): EventResponseDto {
    return {
      id: row.external_id,
      venue: {
        id: row.venue_external_id,
        name: row.venue_name,
      },
      name: row.name,
      vipPrice: Number.parseFloat(row.vip_price),
      firstRowPrice: Number.parseFloat(row.first_row_price),
      gaPrice: Number.parseFloat(row.ga_price),
      eventDatetime: row.event_datetime.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}
