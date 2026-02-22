import { Module } from "@nestjs/common";
import { EventsController } from "src/events/events.controller";
import { EventsRepository } from "src/events/events.repository";
import { EventsService } from "src/events/events.service";

@Module({
  controllers: [EventsController],
  providers: [EventsService, EventsRepository],
})
export class EventsModule {}
