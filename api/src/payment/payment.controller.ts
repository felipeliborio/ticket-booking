import { Body, Controller, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { PayBookingDto } from "src/payment/dto/pay-booking.dto";
import { PayBookingResponseDto } from "src/payment/dto/pay-booking-response.dto";
import { PaymentService } from "src/payment/payment.service";

@Controller("payment")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: "Set payment status for a booking" })
  @ApiOkResponse({ type: PayBookingResponseDto })
  async pay(@Body() input: PayBookingDto): Promise<PayBookingResponseDto> {
    return this.paymentService.pay(input);
  }
}
