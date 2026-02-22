import { Module } from "@nestjs/common";
import { PaymentController } from "src/payment/payment.controller";
import { PaymentRepository } from "src/payment/payment.repository";
import { PaymentService } from "src/payment/payment.service";

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
