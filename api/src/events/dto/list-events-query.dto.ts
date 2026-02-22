import { ApiPropertyOptional } from "@nestjs/swagger";

export class ListEventsQueryDto {
  @ApiPropertyOptional({
    description: "Event name filter (partial match)",
    example: "Rock",
  })
  name?: string;

  @ApiPropertyOptional({
    description: "Page size",
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  limit?: string;

  @ApiPropertyOptional({
    description: "Opaque cursor returned by the previous page",
    example:
      "eyJldmVudERhdGV0aW1lIjoiMjAyNi0wMy0wMVQxOTowMDowMC4wMDBaIiwiZXh0ZXJuYWxJZCI6ImYzMjY0ZGY5LWQ2ZTQtNGY0MS1iODY1LWZhZjhlMGY4YzJhNCJ9",
  })
  cursor?: string;
}
