import { Controller, Get } from "@nestjs/common";

@Controller("status")
export class StatusController {
  @Get()
  get() {
    return {
      updatedAt: new Date().toISOString(),
    };
  }
}
