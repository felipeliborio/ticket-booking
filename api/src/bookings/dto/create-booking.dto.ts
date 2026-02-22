import { ApiProperty } from "@nestjs/swagger";

export class CreateBookingDto {
  @ApiProperty({ format: "uuid" })
  userId!: string;

  @ApiProperty({ format: "uuid" })
  bookingId!: string;

  @ApiProperty({ format: "uuid" })
  eventId!: string;

  @ApiProperty({ example: 2, minimum: 0 })
  vipSeats!: number;

  @ApiProperty({ example: 0, minimum: 0 })
  firstRowSeats!: number;

  @ApiProperty({ example: 3, minimum: 0 })
  gaSeats!: number;
}
