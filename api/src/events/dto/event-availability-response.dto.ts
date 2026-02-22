import { ApiProperty } from "@nestjs/swagger";

class AvailableTicketsDto {
  @ApiProperty({ example: 120 })
  vip!: number;

  @ApiProperty({ example: 240 })
  firstRow!: number;

  @ApiProperty({ example: 3600 })
  ga!: number;

  @ApiProperty({ example: 3960 })
  total!: number;
}

export class EventAvailabilityResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ type: AvailableTicketsDto })
  availableTickets!: AvailableTicketsDto;
}
