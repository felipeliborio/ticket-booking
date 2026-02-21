import { Injectable } from "@nestjs/common";
import { StatusRepository } from "src/status/status.repository";
import { StatusResponse } from "src/status/status.types";

@Injectable()
export class StatusService {
  constructor(private readonly statusRepository: StatusRepository) {}

  async getStatus(): Promise<StatusResponse> {
    return {
      updatedAt: new Date().toISOString(),
      dbStatus: await this.statusRepository.findDatabaseStatus(),
    };
  }
}
