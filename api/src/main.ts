import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from "@nestjs/swagger";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvironment() {
  const candidateFiles = [".env.development", ".env.local", ".env"];
  const envFile = candidateFiles.find((file) =>
    existsSync(resolve(process.cwd(), file)),
  );
  const envConfig = dotenv.config(envFile ? { path: envFile } : undefined);
  dotenvExpand.expand(envConfig);
}

async function bootstrap() {
  loadEnvironment();
  const { AppModule } = await import("./app.module.js");
  const app: INestApplication = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle("Ticket Booking API")
    .setDescription("API documentation")
    .setVersion("0.0.1")
    .build();
  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
