import { Test, TestingModule } from "@nestjs/testing";
import { EventResponseDto } from "src/events/dto/event-response.dto";
import { ListEventsResponseDto } from "src/events/dto/list-events-response.dto";
import { EventsController } from "src/events/events.controller";
import { EventsService } from "src/events/events.service";

describe("EventsController", () => {
  let controller: EventsController;
  let eventsService: {
    findAll: jest.Mock<Promise<ListEventsResponseDto>>;
    findOne: jest.Mock<Promise<EventResponseDto>>;
  };

  beforeEach(async () => {
    eventsService = {
      findAll: jest.fn() as unknown as jest.Mock<
        Promise<ListEventsResponseDto>
      >,
      findOne: jest.fn() as unknown as jest.Mock<Promise<EventResponseDto>>,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: eventsService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should list events with pagination", async () => {
    eventsService.findAll.mockResolvedValue({
      events: [],
      limit: 20,
      found: 0,
      hasMore: false,
      nextCursor: null,
    });

    await controller.findAll({ name: "Rock", limit: "20", cursor: "abc" });

    expect(eventsService.findAll).toHaveBeenCalledWith({
      name: "Rock",
      limit: "20",
      cursor: "abc",
    });
  });

  it("should get event details by external id", async () => {
    const event: EventResponseDto = {
      id: "f3264df9-d6e4-4f41-b865-faf8e0f8c2a4",
      venue: {
        id: "5e67ec2d-35a0-408e-9f35-f6f3fd7e78cb",
        name: "Venue 1",
      },
      name: "Festival 2026",
      vipPrice: 120.5,
      firstRowPrice: 80.25,
      gaPrice: 35,
      eventDatetime: "2026-03-01T19:00:00.000Z",
      createdAt: "2026-02-21T00:00:00.000Z",
      updatedAt: "2026-02-21T00:00:00.000Z",
    };

    eventsService.findOne.mockResolvedValue(event);

    const response = await controller.findOne(event.id);

    expect(eventsService.findOne).toHaveBeenCalledWith(event.id);
    expect(response).toEqual(event);
  });
});
