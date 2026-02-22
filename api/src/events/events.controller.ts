import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { EventResponseDto } from "src/events/dto/event-response.dto";
import { ListEventsQueryDto } from "src/events/dto/list-events-query.dto";
import { ListEventsResponseDto } from "src/events/dto/list-events-response.dto";
import { EventsService } from "src/events/events.service";

@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: "List events" })
  @ApiQuery({ name: "name", required: false })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiQuery({ name: "cursor", required: false })
  @ApiOkResponse({ type: ListEventsResponseDto })
  async findAll(
    @Query() query: ListEventsQueryDto,
  ): Promise<ListEventsResponseDto> {
    return this.eventsService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get event details" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ type: EventResponseDto })
  @ApiNotFoundResponse({ description: "Event not found." })
  async findOne(@Param("id") id: string): Promise<EventResponseDto> {
    return this.eventsService.findOne(id);
  }
}
