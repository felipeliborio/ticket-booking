import { Module } from "@nestjs/common";
import { BookingsModule } from "src/bookings/bookings.module";
import { EventsModule } from "src/events/events.module";
import { StatusModule } from "src/status/status.module";

@Module({
  imports: [StatusModule, EventsModule, BookingsModule],
})
export class AppModule {}
