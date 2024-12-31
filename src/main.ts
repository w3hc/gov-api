import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Jelastic
  app.enableCors();

  // Add API prefix
  app.setGlobalPrefix('api');

  // Use environment port or default
  // Jelastic sets PORT env variable automatically
  const port = process.env.PORT || 3000;

  // Listen on all network interfaces
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port ${port}`);
}
bootstrap();
