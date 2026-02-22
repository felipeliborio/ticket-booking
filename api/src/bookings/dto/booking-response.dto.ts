import { ApiProperty } from "@nestjs/swagger";

class BookedSeatsDto {
  @ApiProperty({ example: 2 })
  vip!: number;

  @ApiProperty({ example: 0 })
  firstRow!: number;

  @ApiProperty({ example: 3 })
  ga!: number;

  @ApiProperty({ example: 5 })
  total!: number;
}

export class BookingResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ format: "uuid" })
  eventId!: string;

  @ApiProperty({ enum: ["pending", "success", "failure"] })
  status!: "pending" | "success" | "failure";

  @ApiProperty({ type: BookedSeatsDto })
  bookedSeats!: BookedSeatsDto;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;

  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}
