import { Test, TestingModule } from "@nestjs/testing";
import { StatusController } from "./status.controller";

describe("StatusController", () => {
  let controller: StatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusController],
    }).compile();

    controller = module.get<StatusController>(StatusController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should have an specific response body format", () => {
    expect(new Set(Object.keys(controller.get()))).toEqual(
      new Set(["updatedAt"]),
    );
  });
});
