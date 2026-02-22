import { ApiProperty } from "@nestjs/swagger";

export class PayBookingResponseDto {
  @ApiProperty({ format: "uuid" })
  bookingId!: string;

  @ApiProperty({ enum: ["success", "failure"] })
  status!: "success" | "failure";

  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}
