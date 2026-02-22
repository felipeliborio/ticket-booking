import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PayBookingDto } from "src/payment/dto/pay-booking.dto";
import { PayBookingResponseDto } from "src/payment/dto/pay-booking-response.dto";
import { PaymentRepository } from "src/payment/payment.repository";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class PaymentService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async pay(input: PayBookingDto): Promise<PayBookingResponseDto> {
    this.assertUuid(input.bookingId, "bookingId");

    if (input.status !== "success" && input.status !== "failure") {
      throw new BadRequestException(
        "Invalid status. Expected one of: success, failure.",
      );
    }

    const updatedPayment = await this.paymentRepository.updatePaymentStatus({
      bookingExternalId: input.bookingId,
      status: input.status,
    });

    if (!updatedPayment) {
      const existingPayment =
        await this.paymentRepository.findByBookingExternalId(input.bookingId);

      if (!existingPayment) {
        throw new NotFoundException("Payment not found for booking.");
      }

      throw new ConflictException(
        "Payment can only be updated when both payment and booking are pending.",
      );
    }

    return {
      bookingId: updatedPayment.booking_external_id,
      status: input.status,
      updatedAt: updatedPayment.updated_at.toISOString(),
    };
  }

  private assertUuid(value: string, fieldName: string): void {
    if (!UUID_REGEX.test(value)) {
      throw new BadRequestException(`Invalid ${fieldName}. Expected a UUID.`);
    }
  }
}
