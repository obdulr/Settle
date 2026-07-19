import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { json, raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Disable default body parser so we can configure custom raw-body support
    bodyParser: false,
  });

  // Raw body parser for Stripe webhook route (signature verification requires the raw body)
  app.use(
    ['/stripe/webhook', '/api/v1/stripe/webhook'],
    raw({ type: '*/*', limit: '2mb' }),
  );
  // JSON body parser for all other routes
  app.use((req, res, next) => {
    if (req.url === '/stripe/webhook' || req.url === '/api/v1/stripe/webhook') {
      // Preserve rawBody for signature verification
      req.rawBody = req.body;
      next();
    } else {
      json({ limit: '2mb' })(req, res, next);
    }
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

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
