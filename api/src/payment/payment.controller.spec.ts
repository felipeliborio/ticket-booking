import { Test, TestingModule } from "@nestjs/testing";
import { PayBookingResponseDto } from "src/payment/dto/pay-booking-response.dto";
import { PaymentController } from "src/payment/payment.controller";
import { PaymentService } from "src/payment/payment.service";

describe("PaymentController", () => {
  let controller: PaymentController;
  let paymentService: {
    pay: jest.Mock<Promise<PayBookingResponseDto>>;
  };

  beforeEach(async () => {
    paymentService = {
      pay: jest.fn() as unknown as jest.Mock<Promise<PayBookingResponseDto>>,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: paymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should update payment status", async () => {
    paymentService.pay.mockResolvedValue({
      bookingId: "9dbc5a98-dcda-4e49-9628-52fef26e6482",
      status: "success",
      updatedAt: "2026-02-22T00:00:00.000Z",
    });

    const payload = {
      bookingId: "9dbc5a98-dcda-4e49-9628-52fef26e6482",
      status: "success" as const,
    };

    const response = await controller.pay(payload);

    expect(paymentService.pay).toHaveBeenCalledWith(payload);
    expect(response.status).toBe("success");
  });
});
