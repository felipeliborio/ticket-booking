import { ApiProperty } from "@nestjs/swagger";

class BookingEventDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "Rock in Rio - Day 1" })
  name!: string;

  @ApiProperty({ format: "date-time" })
  eventDatetime!: string;

  @ApiProperty({ example: "Allianz Parque" })
  venueName!: string;
}

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

  @ApiProperty({ type: BookingEventDto })
  event!: BookingEventDto;

  @ApiProperty({ enum: ["pending", "success", "failure"] })
  status!: "pending" | "success" | "failure";

  @ApiProperty({ type: BookedSeatsDto })
  bookedSeats!: BookedSeatsDto;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;

  @ApiProperty({ format: "date-time" })
  updatedAt!: string;

  @ApiProperty({ example: 1234.5 })
  totalCost!: number;
}
