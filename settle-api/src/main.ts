import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with credentials support for the frontend
  const allowedOrigins = [
    'http://localhost:3025',
    'https://www.settleinpeace.com',
    'https://settleinpeace.com',
    'https://settle-e700.onrender.com',
  ];
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
    allowedOrigins.push(frontendUrl);
  }
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4025);
}
bootstrap();
