import { Controller, Get } from "@nestjs/common";
import { StatusService } from "src/status/status.service";

@Controller("status")
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  async get() {
    return this.statusService.getStatus();
  }
}
