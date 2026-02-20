import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
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
