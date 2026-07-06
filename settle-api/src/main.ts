import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with credentials support for the frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3025';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4025);
}
bootstrap();
