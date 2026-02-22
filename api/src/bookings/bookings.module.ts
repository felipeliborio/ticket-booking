import { Module } from "@nestjs/common";
import { AppUserRepository } from "src/app-user/app-user.repository";
import { BookingsController } from "src/bookings/bookings.controller";
import { BookingsPendingSweeperService } from "src/bookings/bookings-pending-sweeper.service";
import { BookingsRepository } from "src/bookings/bookings.repository";
import { BookingsService } from "src/bookings/bookings.service";
import { EventsRepository } from "src/events/events.repository";

@Module({
  controllers: [BookingsController],
  providers: [
    BookingsService,
    BookingsRepository,
    EventsRepository,
    AppUserRepository,
    BookingsPendingSweeperService,
  ],
})
export class BookingsModule {}
