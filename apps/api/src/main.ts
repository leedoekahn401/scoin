import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/filters/app-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.enableCors({ origin: config.getOrThrow<string[]>('corsOrigins'), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AppExceptionFilter());
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('SchoolCoin API')
    .setVersion('0.1.0')
    .addCookieAuth('access_token')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Kiosk-Key' }, 'kiosk')
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, swagger), {
    jsonDocumentUrl: 'docs-json',
  });

  await app.listen(config.getOrThrow<number>('port'));
}

void bootstrap();
