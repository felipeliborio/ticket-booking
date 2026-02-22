import { Injectable } from "@nestjs/common";
import { database } from "infra/database";
import { BookingInsertRow } from "src/bookings/bookings.types";

@Injectable()
export class BookingsRepository {
  async findByExternalId(
    externalId: string,
  ): Promise<BookingInsertRow | undefined> {
    const queryResult = await database.query<BookingInsertRow>({
      text: `
        SELECT
          external_id,
          status,
          vip_seats,
          first_row_seats,
          ga_seats,
          created_at,
          updated_at
        FROM booking
        WHERE external_id = $1
        LIMIT 1;
      `,
      values: [externalId],
    });

    return queryResult.rows[0];
  }

  async insertPendingBooking(input: {
    bookingExternalId: string;
    eventInternalId: number;
    appUserInternalId: number;
    vipSeats: number;
    firstRowSeats: number;
    gaSeats: number;
  }): Promise<BookingInsertRow | undefined> {
    const queryResult = await database.query<BookingInsertRow>({
      text: `
        WITH event_lock AS (
          SELECT
            e.id,
            v.vip_seats AS venue_vip_seats,
            v.first_row_seats AS venue_first_row_seats,
            v.ga_seats AS venue_ga_seats
          FROM event e
          INNER JOIN venue v ON v.id = e.venue_id
          WHERE e.id = $2
          FOR UPDATE
        ),
        current_reserved AS (
          SELECT
            COALESCE(SUM(b.vip_seats), 0)::int AS vip_reserved,
            COALESCE(SUM(b.first_row_seats), 0)::int AS first_row_reserved,
            COALESCE(SUM(b.ga_seats), 0)::int AS ga_reserved
          FROM booking b
          INNER JOIN event_lock el ON el.id = b.event_id
          WHERE b.status IN ('pending', 'success')
        ),
        can_book AS (
          SELECT 1
          FROM event_lock el
          CROSS JOIN current_reserved cr
          WHERE ($3 + cr.vip_reserved) <= el.venue_vip_seats
            AND ($4 + cr.first_row_reserved) <= el.venue_first_row_seats
            AND ($5 + cr.ga_reserved) <= el.venue_ga_seats
        )
        INSERT INTO booking (
          external_id,
          event_id,
          vip_seats,
          first_row_seats,
          ga_seats,
          app_user_id,
          status
        )
        SELECT
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'pending'::booking_status
        FROM can_book
        ON CONFLICT (external_id) DO NOTHING
        RETURNING
          external_id,
          status,
          vip_seats,
          first_row_seats,
          ga_seats,
          created_at,
          updated_at;
      `,
      values: [
        input.bookingExternalId,
        input.eventInternalId,
        input.vipSeats,
        input.firstRowSeats,
        input.gaSeats,
        input.appUserInternalId,
      ],
    });

    return queryResult.rows[0];
  }
}
