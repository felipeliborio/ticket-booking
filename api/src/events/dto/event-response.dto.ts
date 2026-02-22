import { ApiProperty } from "@nestjs/swagger";

class EventVenueResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ maxLength: 255 })
  name!: string;
}

export class EventResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ type: EventVenueResponseDto })
  venue!: EventVenueResponseDto;

  @ApiProperty({ maxLength: 255 })
  name!: string;

  @ApiProperty({ type: Number, example: 100 })
  vipPrice!: number;

  @ApiProperty({ type: Number, example: 50 })
  firstRowPrice!: number;

  @ApiProperty({ type: Number, example: 10 })
  gaPrice!: number;

  @ApiProperty({ format: "date-time" })
  eventDatetime!: string;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;

  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}
