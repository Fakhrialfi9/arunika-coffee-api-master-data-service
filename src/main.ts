import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppConfig } from './config/app.config.js';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.getOrThrow<AppConfig['port']>('app.port');
  const host = config.getOrThrow<AppConfig['host']>('app.host');

  await app.listen(port, host);
}

void bootstrap();
