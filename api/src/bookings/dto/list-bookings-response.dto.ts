import { ApiProperty } from "@nestjs/swagger";
import { BookingResponseDto } from "src/bookings/dto/booking-response.dto";

export class ListBookingsResponseDto {
  @ApiProperty({ type: [BookingResponseDto] })
  bookings!: BookingResponseDto[];

  @ApiProperty({ example: 2 })
  found!: number;
}
