import { Test, TestingModule } from "@nestjs/testing";
import { StatusController } from "src/status/status.controller";
import { StatusService } from "src/status/status.service";
import { StatusResponse } from "src/status/status.types";

describe("StatusController", () => {
  let controller: StatusController;
  let statusService: { getStatus: jest.Mock<Promise<StatusResponse>> };

  beforeEach(async () => {
    statusService = {
      getStatus: jest.fn() as unknown as jest.Mock<
        Promise<StatusResponse>,
        any,
        any
      >,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusController],
      providers: [
        {
          provide: StatusService,
          useValue: statusService,
        },
      ],
    }).compile();

    controller = module.get<StatusController>(StatusController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should have an specific response body format", async () => {
    statusService.getStatus.mockResolvedValue({
      updatedAt: "2026-02-20T00:00:00.000Z",
      dbStatus: {
        openConnections: 1,
        maxConnections: 100,
        serverVersion: "16.1",
      },
    });

    const response = await controller.get();

    expect(new Set(Object.keys(response))).toEqual(
      new Set(["updatedAt", "dbStatus"]),
    );
    expect(new Set(Object.keys(response.dbStatus))).toEqual(
      new Set(["openConnections", "maxConnections", "serverVersion"]),
    );
  });
});
