import { Body, Controller, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation } from "@nestjs/swagger";
import { CreateBookingDto } from "src/bookings/dto/create-booking.dto";
import { CreateBookingResponseDto } from "src/bookings/dto/create-booking-response.dto";
import { BookingsService } from "src/bookings/bookings.service";

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: "Create booking" })
  @ApiCreatedResponse({ type: CreateBookingResponseDto })
  async create(
    @Body() input: CreateBookingDto,
  ): Promise<CreateBookingResponseDto> {
    return this.bookingsService.create(input);
  }
}
