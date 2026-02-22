import { Injectable } from "@nestjs/common";
import { database } from "infra/database";
import { PaymentRow } from "src/payment/payment.types";

@Injectable()
export class PaymentRepository {
  async updatePaymentStatus(input: {
    bookingExternalId: string;
    status: "success" | "failure";
  }): Promise<PaymentRow | undefined> {
    const queryResult = await database.query<PaymentRow>({
      text: `
        UPDATE payment p
        SET
          status = $2::payment_status,
          updated_at = now()
        FROM booking b
        WHERE p.booking_id = b.id
          AND b.external_id = $1
          AND p.status = 'pending'::payment_status
          AND b.status = 'pending'::booking_status
        RETURNING
          b.external_id AS booking_external_id,
          p.status AS payment_status,
          b.status AS booking_status,
          p.updated_at;
      `,
      values: [input.bookingExternalId, input.status],
    });

    return queryResult.rows[0];
  }

  async findByBookingExternalId(
    bookingExternalId: string,
  ): Promise<PaymentRow | undefined> {
    const queryResult = await database.query<PaymentRow>({
      text: `
        SELECT
          b.external_id AS booking_external_id,
          p.status AS payment_status,
          b.status AS booking_status,
          p.updated_at
        FROM payment p
        INNER JOIN booking b ON b.id = p.booking_id
        WHERE b.external_id = $1
        LIMIT 1;
      `,
      values: [bookingExternalId],
    });

    return queryResult.rows[0];
  }
}
