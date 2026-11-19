import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { API_PREFIX } from '@schoolcoin/types';
import cookieParser from 'cookie-parser';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/filters/app-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix(API_PREFIX, { exclude: [{ path: 'health', method: RequestMethod.GET }] });
  app.use(cookieParser());
  app.enableCors({ origin: config.getOrThrow<string[]>('corsOrigins'), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AppExceptionFilter());
  app.enableShutdownHooks();

  // Student photos and menu images (B3: Docker volume, served by the API at /uploads).
  const uploadDir = resolve(config.getOrThrow<string>('uploadDir'));
  mkdirSync(uploadDir, { recursive: true });
  app.useStaticAssets(uploadDir, { prefix: '/uploads' });

  const swagger = new DocumentBuilder()
    .setTitle('SchoolCoin API')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('refresh_token')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Kiosk-Key' }, 'kiosk-device')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Kiosk-Session' }, 'kiosk-session')
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, swagger), {
    jsonDocumentUrl: 'docs-json',
  });

  await app.listen(config.getOrThrow<number>('port'));
}

void bootstrap();
