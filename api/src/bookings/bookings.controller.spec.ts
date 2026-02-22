import { Test, TestingModule } from "@nestjs/testing";
import { BookingsController } from "src/bookings/bookings.controller";
import { CreateBookingResponseDto } from "src/bookings/dto/create-booking-response.dto";
import { ListBookingsResponseDto } from "src/bookings/dto/list-bookings-response.dto";
import { BookingsService } from "src/bookings/bookings.service";

describe("BookingsController", () => {
  let controller: BookingsController;
  let bookingsService: {
    create: jest.Mock<Promise<CreateBookingResponseDto>>;
    findByUserId: jest.Mock<Promise<ListBookingsResponseDto>>;
  };

  beforeEach(async () => {
    bookingsService = {
      create: jest.fn() as unknown as jest.Mock<
        Promise<CreateBookingResponseDto>
      >,
      findByUserId: jest.fn() as unknown as jest.Mock<
        Promise<ListBookingsResponseDto>
      >,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: bookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should list bookings by user id", async () => {
    bookingsService.findByUserId.mockResolvedValue({
      bookings: [],
      found: 0,
    });

    const response = await controller.findByUser({
      userId: "00000000-0000-4000-8000-000000000001",
    });

    expect(bookingsService.findByUserId).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
    );
    expect(response.found).toBe(0);
  });

  it("should create a pending booking", async () => {
    bookingsService.create.mockResolvedValue({
      id: "9dbc5a98-dcda-4e49-9628-52fef26e6482",
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

    const payload = {
      userId: "00000000-0000-4000-8000-000000000001",
      bookingId: "9dbc5a98-dcda-4e49-9628-52fef26e6482",
      eventId: "00000000-0000-4000-8000-0000000003e9",
      vipSeats: 2,
      firstRowSeats: 0,
      gaSeats: 3,
    };

    const response = await controller.create(payload);

    expect(bookingsService.create).toHaveBeenCalledWith(payload);
    expect(response.status).toBe("pending");
    expect(response.bookedSeats.total).toBe(5);
  });
});
