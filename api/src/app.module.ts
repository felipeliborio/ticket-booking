import { Module } from "@nestjs/common";
import { EventsModule } from "src/events/events.module";
import { StatusModule } from "src/status/status.module";

@Module({
  imports: [StatusModule, EventsModule],
})
export class AppModule {}
