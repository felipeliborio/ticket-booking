import { Module } from "@nestjs/common";
import { StatusController } from "src/status/status.controller";
import { StatusRepository } from "src/status/status.repository";
import { StatusService } from "src/status/status.service";

@Module({
  controllers: [StatusController],
  providers: [StatusService, StatusRepository],
})
export class StatusModule {}
