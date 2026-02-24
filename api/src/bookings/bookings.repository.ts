import { Injectable } from "@nestjs/common";
import { database } from "infra/database";
import {
  BookingInsertAttemptRow,
  BookingInsertRow,
  BookingListRow,
} from "src/bookings/bookings.types";

@Injectable()
export class BookingsRepository {
  async failExpiredPendingBookings(): Promise<number> {
    const queryResult = await database.query({
      text: `
        UPDATE booking
        SET
          status = 'failure'::booking_status,
          updated_at = now()
        WHERE status = 'pending'::booking_status
          AND created_at <= now() - interval '5 minutes';
      `,
    });

    return queryResult.rowCount ?? 0;
  }

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

  async findByUserExternalId(
    userExternalId: string,
  ): Promise<BookingListRow[]> {
    const queryResult = await database.query<BookingListRow>({
      text: `
        SELECT
          b.external_id,
          e.external_id AS event_external_id,
          e.name AS event_name,
          e.event_datetime,
          v.name AS venue_name,
          b.status,
          b.vip_seats,
          b.first_row_seats,
          b.ga_seats,
          (
            (b.vip_seats * e.vip_price)
            + (b.first_row_seats * e.first_row_price)
            + (b.ga_seats * e.ga_price)
          ) AS total_cost,
          b.created_at,
          b.updated_at
        FROM booking b
        INNER JOIN app_user u ON u.id = b.app_user_id
        INNER JOIN event e ON e.id = b.event_id
        INNER JOIN venue v ON v.id = e.venue_id
        WHERE u.external_id = $1
        ORDER BY b.created_at DESC, b.id DESC;
      `,
      values: [userExternalId],
    });

    return queryResult.rows;
  }

  async insertPendingBooking(input: {
    bookingExternalId: string;
    eventExternalId: string;
    appUserExternalId: string;
    vipSeats: number;
    firstRowSeats: number;
    gaSeats: number;
  }): Promise<BookingInsertAttemptRow> {
    const queryResult = await database.query<BookingInsertAttemptRow>({
      text: `
        WITH event_lock AS (
          SELECT
            e.id,
            v.vip_seats AS venue_vip_seats,
            v.first_row_seats AS venue_first_row_seats,
            v.ga_seats AS venue_ga_seats
          FROM event e
          INNER JOIN venue v ON v.id = e.venue_id
          WHERE e.external_id = $2
          FOR UPDATE
        ),
        inserted_app_user AS (
          INSERT INTO app_user (external_id)
          VALUES ($6)
          ON CONFLICT (external_id) DO NOTHING
          RETURNING id
        ),
        app_user_row AS (
          SELECT id FROM inserted_app_user
          UNION ALL
          SELECT u.id
          FROM app_user u
          WHERE u.external_id = $6
          LIMIT 1
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
        ),
        inserted_booking AS (
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
            el.id,
            $3,
            $4,
            $5,
            au.id,
            'pending'::booking_status
          FROM can_book
          CROSS JOIN event_lock el
          CROSS JOIN app_user_row au
          ON CONFLICT (external_id) DO NOTHING
          RETURNING
            id,
            external_id,
            status,
            vip_seats,
            first_row_seats,
            ga_seats,
            created_at,
            updated_at
        ),
        inserted_payment AS (
          INSERT INTO payment (booking_id, status)
          SELECT id, 'pending'::payment_status
          FROM inserted_booking
        )
        SELECT
          (SELECT EXISTS(SELECT 1 FROM event_lock)) AS event_exists,
          (SELECT EXISTS(SELECT 1 FROM app_user_row)) AS app_user_exists,
          ib.external_id,
          ib.status,
          ib.vip_seats,
          ib.first_row_seats,
          ib.ga_seats,
          ib.created_at,
          ib.updated_at
        FROM inserted_booking ib
        UNION ALL
        SELECT
          (SELECT EXISTS(SELECT 1 FROM event_lock)) AS event_exists,
          (SELECT EXISTS(SELECT 1 FROM app_user_row)) AS app_user_exists,
          null AS external_id,
          null AS status,
          null AS vip_seats,
          null AS first_row_seats,
          null AS ga_seats,
          null AS created_at,
          null AS updated_at
        WHERE NOT EXISTS (SELECT 1 FROM inserted_booking)
        LIMIT 1;
      `,
      values: [
        input.bookingExternalId,
        input.eventExternalId,
        input.vipSeats,
        input.firstRowSeats,
        input.gaSeats,
        input.appUserExternalId,
      ],
    });

    return queryResult.rows[0];
  }
}
