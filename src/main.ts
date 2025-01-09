import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Gov API')
    .setDescription('Gov API docs')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  Logger.log(`Application is running on port ${port}`);
  Logger.log(
    `Swagger documentation available at: http://localhost:${port}/api and https://gov-api.w3hc.org/api when in prod`,
  );
}
bootstrap();
