import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PaymentRepository } from "src/payment/payment.repository";
import { PaymentService } from "src/payment/payment.service";
import { PaymentRow } from "src/payment/payment.types";

describe("PaymentService", () => {
  let service: PaymentService;
  let paymentRepository: {
    updatePaymentStatus: jest.Mock<Promise<PaymentRow | undefined>>;
    findByBookingExternalId: jest.Mock<Promise<PaymentRow | undefined>>;
  };

  const bookingId = "9dbc5a98-dcda-4e49-9628-52fef26e6482";

  beforeEach(async () => {
    paymentRepository = {
      updatePaymentStatus: jest.fn() as unknown as jest.Mock<
        Promise<PaymentRow | undefined>
      >,
      findByBookingExternalId: jest.fn() as unknown as jest.Mock<
        Promise<PaymentRow | undefined>
      >,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PaymentRepository,
          useValue: paymentRepository,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it("should update payment status", async () => {
    paymentRepository.updatePaymentStatus.mockResolvedValue({
      booking_external_id: bookingId,
      payment_status: "success",
      booking_status: "pending",
      updated_at: new Date("2026-02-22T00:00:00.000Z"),
    });

    const response = await service.pay({ bookingId, status: "success" });

    expect(paymentRepository.updatePaymentStatus).toHaveBeenCalledWith({
      bookingExternalId: bookingId,
      status: "success",
    });
    expect(response).toEqual({
      bookingId,
      status: "success",
      updatedAt: "2026-02-22T00:00:00.000Z",
    });
  });

  it("should reject invalid booking id", async () => {
    await expect(
      service.pay({ bookingId: "invalid", status: "success" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("should reject invalid status", async () => {
    await expect(
      service.pay({ bookingId, status: "pending" as "success" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("should return not found when payment does not exist", async () => {
    paymentRepository.updatePaymentStatus.mockResolvedValue(undefined);
    paymentRepository.findByBookingExternalId.mockResolvedValue(undefined);

    await expect(service.pay({ bookingId, status: "failure" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("should return conflict when payment is not pending", async () => {
    paymentRepository.updatePaymentStatus.mockResolvedValue(undefined);
    paymentRepository.findByBookingExternalId.mockResolvedValue({
      booking_external_id: bookingId,
      payment_status: "success",
      booking_status: "success",
      updated_at: new Date("2026-02-22T00:00:00.000Z"),
    });

    await expect(service.pay({ bookingId, status: "failure" })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
