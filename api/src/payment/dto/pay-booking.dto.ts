import { ApiProperty } from "@nestjs/swagger";

export class PayBookingDto {
  @ApiProperty({ format: "uuid" })
  bookingId!: string;

  @ApiProperty({ enum: ["success", "failure"] })
  status!: "success" | "failure";
}
