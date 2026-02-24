import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { BookingsRepository } from "src/bookings/bookings.repository";
import { BookingsService } from "src/bookings/bookings.service";
import {
  BookingInsertAttemptRow,
  BookingInsertRow,
  BookingListRow,
} from "src/bookings/bookings.types";

describe("BookingsService", () => {
  let service: BookingsService;
  let bookingsRepository: {
    findByExternalId: jest.Mock<Promise<BookingInsertRow | undefined>>;
    findByUserExternalId: jest.Mock<Promise<BookingListRow[]>>;
    insertPendingBooking: jest.Mock<Promise<BookingInsertAttemptRow>>;
  };

  const validPayload = {
    userId: "00000000-0000-4000-8000-000000000001",
    bookingId: "9dbc5a98-dcda-4e49-9628-52fef26e6482",
    eventId: "00000000-0000-4000-8000-0000000003e9",
    vipSeats: 2,
    firstRowSeats: 0,
    gaSeats: 3,
  };

  beforeEach(async () => {
    bookingsRepository = {
      findByExternalId: jest.fn() as unknown as jest.Mock<
        Promise<BookingInsertRow | undefined>
      >,
      findByUserExternalId: jest.fn() as unknown as jest.Mock<
        Promise<BookingListRow[]>
      >,
      insertPendingBooking: jest.fn() as unknown as jest.Mock<
        Promise<BookingInsertAttemptRow>
      >,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: BookingsRepository,
          useValue: bookingsRepository,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it("should list bookings by user id", async () => {
    bookingsRepository.findByUserExternalId.mockResolvedValue([
      {
        external_id: "9dbc5a98-dcda-4e49-9628-52fef26e6482",
        event_external_id: "00000000-0000-4000-8000-0000000003e9",
        event_name: "Rock in Rio - Day 1",
        event_datetime: new Date("2026-03-10T20:00:00.000Z"),
        venue_name: "Allianz Parque",
        status: "pending",
        vip_seats: 2,
        first_row_seats: 0,
        ga_seats: 3,
        total_cost: "540.0000",
        created_at: new Date("2026-02-22T00:00:00.000Z"),
        updated_at: new Date("2026-02-22T00:00:00.000Z"),
      },
    ]);

    const response = await service.findByUserId(validPayload.userId);

    expect(bookingsRepository.findByUserExternalId).toHaveBeenCalledWith(
      validPayload.userId,
    );
    expect(response.found).toBe(1);
    expect(response.bookings[0]).toEqual({
      id: "9dbc5a98-dcda-4e49-9628-52fef26e6482",
      event: {
        id: "00000000-0000-4000-8000-0000000003e9",
        name: "Rock in Rio - Day 1",
        eventDatetime: "2026-03-10T20:00:00.000Z",
        venueName: "Allianz Parque",
      },
      status: "pending",
      bookedSeats: {
        vip: 2,
        firstRow: 0,
        ga: 3,
        total: 5,
      },
      createdAt: "2026-02-22T00:00:00.000Z",
      updatedAt: "2026-02-22T00:00:00.000Z",
      totalCost: 540,
    });
  });

  it("should reject invalid user id on listing", async () => {
    await expect(service.findByUserId("invalid")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("should create pending booking", async () => {
    bookingsRepository.insertPendingBooking.mockResolvedValue({
      event_exists: true,
      app_user_exists: true,
      external_id: validPayload.bookingId,
      status: "pending",
      vip_seats: 2,
      first_row_seats: 0,
      ga_seats: 3,
      created_at: new Date("2026-02-22T00:00:00.000Z"),
      updated_at: new Date("2026-02-22T00:00:00.000Z"),
    });

    const response = await service.create(validPayload);

    expect(bookingsRepository.insertPendingBooking).toHaveBeenCalledWith({
      bookingExternalId: validPayload.bookingId,
      eventExternalId: validPayload.eventId,
      appUserExternalId: validPayload.userId,
      vipSeats: 2,
      firstRowSeats: 0,
      gaSeats: 3,
    });
    expect(response).toEqual({
      id: validPayload.bookingId,
      status: "pending",
      bookedSeats: {
        vip: 2,
        firstRow: 0,
        ga: 3,
        total: 5,
      },
      createdAt: "2026-02-22T00:00:00.000Z",
      updatedAt: "2026-02-22T00:00:00.000Z",
    });
  });

  it("should return existing booking on conflict", async () => {
    bookingsRepository.insertPendingBooking.mockResolvedValue({
      event_exists: true,
      app_user_exists: true,
      external_id: null,
      status: null,
      vip_seats: null,
      first_row_seats: null,
      ga_seats: null,
      created_at: null,
      updated_at: null,
    });
    bookingsRepository.findByExternalId.mockResolvedValue({
      external_id: validPayload.bookingId,
      status: "success",
      vip_seats: 1,
      first_row_seats: 1,
      ga_seats: 0,
      created_at: new Date("2026-02-22T00:00:00.000Z"),
      updated_at: new Date("2026-02-22T00:05:00.000Z"),
    });

    const response = await service.create(validPayload);

    expect(bookingsRepository.findByExternalId).toHaveBeenCalledWith(
      validPayload.bookingId,
    );
    expect(response.bookedSeats).toEqual({
      vip: 1,
      firstRow: 1,
      ga: 0,
      total: 2,
    });
  });

  it("should throw when there are not enough seats available", async () => {
    bookingsRepository.insertPendingBooking.mockResolvedValue({
      event_exists: true,
      app_user_exists: true,
      external_id: null,
      status: null,
      vip_seats: null,
      first_row_seats: null,
      ga_seats: null,
      created_at: null,
      updated_at: null,
    });
    bookingsRepository.findByExternalId.mockResolvedValue(undefined);

    await expect(service.create(validPayload)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("should reject invalid seat count", async () => {
    await expect(
      service.create({
        ...validPayload,
        vipSeats: -1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("should reject when all seats are zero", async () => {
    await expect(
      service.create({
        ...validPayload,
        vipSeats: 0,
        firstRowSeats: 0,
        gaSeats: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("should reject invalid uuid", async () => {
    await expect(
      service.create({
        ...validPayload,
        userId: "invalid",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("should reject missing event", async () => {
    bookingsRepository.insertPendingBooking.mockResolvedValue({
      event_exists: false,
      app_user_exists: true,
      external_id: null,
      status: null,
      vip_seats: null,
      first_row_seats: null,
      ga_seats: null,
      created_at: null,
      updated_at: null,
    });

    await expect(service.create(validPayload)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("should fail when user upsert returns no id", async () => {
    bookingsRepository.insertPendingBooking.mockResolvedValue({
      event_exists: true,
      app_user_exists: false,
      external_id: null,
      status: null,
      vip_seats: null,
      first_row_seats: null,
      ga_seats: null,
      created_at: null,
      updated_at: null,
    });

    await expect(service.create(validPayload)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
