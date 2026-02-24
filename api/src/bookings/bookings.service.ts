import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { BookingResponseDto } from "src/bookings/dto/booking-response.dto";
import { CreateBookingDto } from "src/bookings/dto/create-booking.dto";
import { CreateBookingResponseDto } from "src/bookings/dto/create-booking-response.dto";
import { ListBookingsResponseDto } from "src/bookings/dto/list-bookings-response.dto";
import { BookingsRepository } from "src/bookings/bookings.repository";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class BookingsService {
  constructor(private readonly bookingsRepository: BookingsRepository) {}

  async findByUserId(userId: string): Promise<ListBookingsResponseDto> {
    this.assertUuid(userId, "userId");

    const rows = await this.bookingsRepository.findByUserExternalId(userId);
    const bookings = rows.map((row) => this.mapRowToResponse(row));

    return {
      bookings,
      found: bookings.length,
    };
  }

  async failExpiredPendingBookings(): Promise<number> {
    return this.bookingsRepository.failExpiredPendingBookings();
  }

  async create(input: CreateBookingDto): Promise<CreateBookingResponseDto> {
    this.assertUuid(input.userId, "userId");
    this.assertUuid(input.bookingId, "bookingId");
    this.assertUuid(input.eventId, "eventId");

    const vipSeats = this.parseSeatCount(input.vipSeats, "vipSeats");
    const firstRowSeats = this.parseSeatCount(
      input.firstRowSeats,
      "firstRowSeats",
    );
    const gaSeats = this.parseSeatCount(input.gaSeats, "gaSeats");

    if (vipSeats + firstRowSeats + gaSeats <= 0) {
      throw new BadRequestException(
        "At least one seat must be booked across tiers.",
      );
    }

    const insertAttempt = await this.bookingsRepository.insertPendingBooking({
      bookingExternalId: input.bookingId,
      eventExternalId: input.eventId,
      appUserExternalId: input.userId,
      vipSeats,
      firstRowSeats,
      gaSeats,
    });

    if (!insertAttempt.event_exists) {
      throw new NotFoundException("Event not found.");
    }

    if (!insertAttempt.app_user_exists) {
      throw new InternalServerErrorException("Unable to resolve user.");
    }

    const insertedRow =
      insertAttempt.external_id &&
      insertAttempt.status &&
      insertAttempt.vip_seats !== null &&
      insertAttempt.first_row_seats !== null &&
      insertAttempt.ga_seats !== null &&
      insertAttempt.created_at !== null &&
      insertAttempt.updated_at !== null
        ? {
            external_id: insertAttempt.external_id,
            status: insertAttempt.status,
            vip_seats: insertAttempt.vip_seats,
            first_row_seats: insertAttempt.first_row_seats,
            ga_seats: insertAttempt.ga_seats,
            created_at: insertAttempt.created_at,
            updated_at: insertAttempt.updated_at,
          }
        : undefined;

    const row =
      insertedRow ??
      (await this.bookingsRepository.findByExternalId(input.bookingId));

    if (!row) {
      throw new ConflictException(
        "Not enough seats available for the requested tiers.",
      );
    }

    return {
      id: row.external_id,
      status: row.status,
      bookedSeats: {
        vip: row.vip_seats,
        firstRow: row.first_row_seats,
        ga: row.ga_seats,
        total: row.vip_seats + row.first_row_seats + row.ga_seats,
      },
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private mapRowToResponse(row: {
    external_id: string;
    event_external_id: string;
    event_name: string;
    event_datetime: Date;
    venue_name: string;
    status: "pending" | "success" | "failure";
    vip_seats: number;
    first_row_seats: number;
    ga_seats: number;
    total_cost: number | string;
    created_at: Date;
    updated_at: Date;
  }): BookingResponseDto {
    return {
      id: row.external_id,
      event: {
        id: row.event_external_id,
        name: row.event_name,
        eventDatetime: row.event_datetime.toISOString(),
        venueName: row.venue_name,
      },
      status: row.status,
      bookedSeats: {
        vip: row.vip_seats,
        firstRow: row.first_row_seats,
        ga: row.ga_seats,
        total: row.vip_seats + row.first_row_seats + row.ga_seats,
      },
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      totalCost: Number(row.total_cost),
    };
  }

  private assertUuid(value: string, fieldName: string): void {
    if (!UUID_REGEX.test(value)) {
      throw new BadRequestException(`Invalid ${fieldName}. Expected a UUID.`);
    }
  }

  private parseSeatCount(value: number, fieldName: string): number {
    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException(
        `Invalid ${fieldName}. Expected a non-negative integer.`,
      );
    }

    return value;
  }
}
