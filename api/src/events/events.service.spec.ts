import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { EventsRepository } from "src/events/events.repository";
import { EventsService } from "src/events/events.service";
import { EventDatabaseRow } from "src/events/events.types";

describe("EventsService", () => {
  let service: EventsService;
  let eventsRepository: {
    findAll: jest.Mock<Promise<EventDatabaseRow[]>>;
    findByExternalId: jest.Mock<Promise<EventDatabaseRow | undefined>>;
  };

  beforeEach(async () => {
    eventsRepository = {
      findAll: jest.fn() as unknown as jest.Mock<Promise<EventDatabaseRow[]>>,
      findByExternalId: jest.fn() as unknown as jest.Mock<
        Promise<EventDatabaseRow | undefined>
      >,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: EventsRepository,
          useValue: eventsRepository,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it("should list events using keyset pagination", async () => {
    eventsRepository.findAll.mockResolvedValue([
      {
        external_id: "f3264df9-d6e4-4f41-b865-faf8e0f8c2a4",
        venue_external_id: "5e67ec2d-35a0-408e-9f35-f6f3fd7e78cb",
        venue_name: "Venue 1",
        name: "Festival 2026",
        vip_price: "120.5000",
        first_row_price: "80.2500",
        ga_price: "35.0000",
        event_datetime: new Date("2026-03-01T19:00:00.000Z"),
        created_at: new Date("2026-02-21T00:00:00.000Z"),
        updated_at: new Date("2026-02-21T00:00:00.000Z"),
      },
      {
        external_id: "a0e3ce9a-e1c0-49e9-b920-06ec03f5f239",
        venue_external_id: "5e67ec2d-35a0-408e-9f35-f6f3fd7e78cb",
        venue_name: "Venue 1",
        name: "Festival 2027",
        vip_price: "130.0000",
        first_row_price: "90.0000",
        ga_price: "40.0000",
        event_datetime: new Date("2026-03-02T19:00:00.000Z"),
        created_at: new Date("2026-02-21T00:00:00.000Z"),
        updated_at: new Date("2026-02-21T00:00:00.000Z"),
      },
    ]);

    const response = await service.findAll({ name: "Festival", limit: "1" });

    expect(eventsRepository.findAll).toHaveBeenCalledWith({
      name: "Festival",
      limit: 2,
      cursor: undefined,
    });
    expect(response.limit).toBe(1);
    expect(response.found).toBe(1);
    expect(response.hasMore).toBe(true);
    expect(response.nextCursor).toEqual(expect.any(String));
    expect(response.events[0]).toMatchObject({
      id: "f3264df9-d6e4-4f41-b865-faf8e0f8c2a4",
      venue: {
        id: "5e67ec2d-35a0-408e-9f35-f6f3fd7e78cb",
        name: "Venue 1",
      },
    });
  });

  it("should use parsed cursor in pagination query", async () => {
    eventsRepository.findAll.mockResolvedValue([]);

    const cursor = Buffer.from(
      JSON.stringify({
        eventDatetime: "2026-03-01T19:00:00.000Z",
        externalId: "f3264df9-d6e4-4f41-b865-faf8e0f8c2a4",
      }),
    ).toString("base64");

    await service.findAll({ cursor });

    expect(eventsRepository.findAll).toHaveBeenCalledWith({
      name: undefined,
      limit: 21,
      cursor: {
        eventDatetime: "2026-03-01T19:00:00.000Z",
        externalId: "f3264df9-d6e4-4f41-b865-faf8e0f8c2a4",
      },
    });
  });

  it("should throw for invalid cursor", async () => {
    await expect(service.findAll({ cursor: "invalid" })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("should throw for invalid limit", async () => {
    await expect(service.findAll({ limit: "0" })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("should return event details", async () => {
    eventsRepository.findByExternalId.mockResolvedValue({
      external_id: "f3264df9-d6e4-4f41-b865-faf8e0f8c2a4",
      venue_external_id: "5e67ec2d-35a0-408e-9f35-f6f3fd7e78cb",
      venue_name: "Venue 1",
      name: "Festival 2026",
      vip_price: "120.5000",
      first_row_price: "80.2500",
      ga_price: "35.0000",
      event_datetime: new Date("2026-03-01T19:00:00.000Z"),
      created_at: new Date("2026-02-21T00:00:00.000Z"),
      updated_at: new Date("2026-02-21T00:00:00.000Z"),
    });

    const response = await service.findOne(
      "f3264df9-d6e4-4f41-b865-faf8e0f8c2a4",
    );

    expect(response.id).toBe("f3264df9-d6e4-4f41-b865-faf8e0f8c2a4");
    expect(response.venue).toEqual({
      id: "5e67ec2d-35a0-408e-9f35-f6f3fd7e78cb",
      name: "Venue 1",
    });
  });

  it("should throw when event is not found", async () => {
    eventsRepository.findByExternalId.mockResolvedValue(undefined);

    await expect(
      service.findOne("f3264df9-d6e4-4f41-b865-faf8e0f8c2a4"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
