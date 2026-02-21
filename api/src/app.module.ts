import { Module } from "@nestjs/common";
import { StatusModule } from "src/status/status.module";

@Module({
  imports: [StatusModule],
})
export class AppModule {}
