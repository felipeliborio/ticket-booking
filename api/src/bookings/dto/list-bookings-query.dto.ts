import { ApiProperty } from "@nestjs/swagger";

export class ListBookingsQueryDto {
  @ApiProperty({ format: "uuid" })
  userId!: string;
}
