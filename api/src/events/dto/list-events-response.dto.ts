import { ApiProperty } from "@nestjs/swagger";
import { EventResponseDto } from "src/events/dto/event-response.dto";

export class ListEventsResponseDto {
  @ApiProperty({ type: [EventResponseDto] })
  events!: EventResponseDto[];

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 20 })
  found!: number;

  @ApiProperty({ example: true })
  hasMore!: boolean;

  @ApiProperty({ required: false, nullable: true })
  nextCursor!: string | null;
}
