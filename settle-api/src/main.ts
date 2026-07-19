import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { json, raw, urlencoded } from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Disable default body parser so we can configure custom raw-body support
    bodyParser: false,
  });

  // Helmet middleware for security headers
  app.use(helmet());

  // Raw body parser for Stripe webhook route (signature verification requires the raw body)
  app.use(
    ['/stripe/webhook', '/api/v1/stripe/webhook'],
    raw({ type: '*/*', limit: '2mb' }),
  );
  // JSON body parser for all other routes (1MB limit)
  app.use((req, res, next) => {
    if (req.url === '/stripe/webhook' || req.url === '/api/v1/stripe/webhook') {
      // Preserve rawBody for signature verification
      req.rawBody = req.body;
      next();
    } else {
      json({ limit: '1mb' })(req, res, next);
    }
  });
  // URL-encoded body parser (1MB limit) for non-webhook routes
  app.use((req, res, next) => {
    if (req.url === '/stripe/webhook' || req.url === '/api/v1/stripe/webhook') {
      next();
    } else {
      urlencoded({ limit: '1mb', extended: true })(req, res, next);
    }
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Enable CORS from env variable (comma-separated), with dev fallback
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || ['http://localhost:3025'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4025);
}
bootstrap();
