import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { CreateBookingDto } from "src/bookings/dto/create-booking.dto";
import { CreateBookingResponseDto } from "src/bookings/dto/create-booking-response.dto";
import { ListBookingsQueryDto } from "src/bookings/dto/list-bookings-query.dto";
import { ListBookingsResponseDto } from "src/bookings/dto/list-bookings-response.dto";
import { BookingsService } from "src/bookings/bookings.service";

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: "List bookings by user" })
  @ApiQuery({ name: "userId", format: "uuid" })
  @ApiOkResponse({ type: ListBookingsResponseDto })
  async findByUser(
    @Query() query: ListBookingsQueryDto,
  ): Promise<ListBookingsResponseDto> {
    return this.bookingsService.findByUserId(query.userId);
  }

  @Post()
  @ApiOperation({ summary: "Create booking" })
  @ApiCreatedResponse({ type: CreateBookingResponseDto })
  async create(
    @Body() input: CreateBookingDto,
  ): Promise<CreateBookingResponseDto> {
    return this.bookingsService.create(input);
  }
}
