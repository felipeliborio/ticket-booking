import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppUserRepository } from "src/app-user/app-user.repository";
import { BookingsRepository } from "src/bookings/bookings.repository";
import { BookingsService } from "src/bookings/bookings.service";
import { BookingInsertRow } from "src/bookings/bookings.types";
import { EventsRepository } from "src/events/events.repository";

describe("BookingsService", () => {
  let service: BookingsService;
  let bookingsRepository: {
    findByExternalId: jest.Mock<Promise<BookingInsertRow | undefined>>;
    insertPendingBooking: jest.Mock<Promise<BookingInsertRow | undefined>>;
  };
  let eventsRepository: {
    findInternalIdByExternalId: jest.Mock<Promise<number | undefined>>;
  };
  let appUserRepository: {
    upsertAndGetInternalId: jest.Mock<Promise<number | undefined>>;
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
      insertPendingBooking: jest.fn() as unknown as jest.Mock<
        Promise<BookingInsertRow | undefined>
      >,
    };

    eventsRepository = {
      findInternalIdByExternalId: jest.fn() as unknown as jest.Mock<
        Promise<number | undefined>
      >,
    };

    appUserRepository = {
      upsertAndGetInternalId: jest.fn() as unknown as jest.Mock<
        Promise<number | undefined>
      >,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: BookingsRepository,
          useValue: bookingsRepository,
        },
        {
          provide: EventsRepository,
          useValue: eventsRepository,
        },
        {
          provide: AppUserRepository,
          useValue: appUserRepository,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it("should create pending booking", async () => {
    eventsRepository.findInternalIdByExternalId.mockResolvedValue(11);
    appUserRepository.upsertAndGetInternalId.mockResolvedValue(7);
    bookingsRepository.insertPendingBooking.mockResolvedValue({
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
      eventInternalId: 11,
      appUserInternalId: 7,
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
    eventsRepository.findInternalIdByExternalId.mockResolvedValue(11);
    appUserRepository.upsertAndGetInternalId.mockResolvedValue(7);
    bookingsRepository.insertPendingBooking.mockResolvedValue(undefined);
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
    eventsRepository.findInternalIdByExternalId.mockResolvedValue(11);
    appUserRepository.upsertAndGetInternalId.mockResolvedValue(7);
    bookingsRepository.insertPendingBooking.mockResolvedValue(undefined);
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
    eventsRepository.findInternalIdByExternalId.mockResolvedValue(undefined);
    appUserRepository.upsertAndGetInternalId.mockResolvedValue(7);

    await expect(service.create(validPayload)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("should fail when user upsert returns no id", async () => {
    eventsRepository.findInternalIdByExternalId.mockResolvedValue(11);
    appUserRepository.upsertAndGetInternalId.mockResolvedValue(undefined);

    await expect(service.create(validPayload)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
