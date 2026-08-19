import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { appConfig } from './config/app.config.js';
import { validateEnvironment } from './config/env.validation.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { GrpcHealthService } from './infrastructure/health/grpc-health.service.js';
import { MasterDataGrpcController } from './infrastructure/grpc/master-data.grpc.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
      validate: validateEnvironment,
      envFilePath: ['.env'],
    }),
    DatabaseModule,
  ],
  controllers: [AppController, MasterDataGrpcController],
  providers: [AppService, GrpcHealthService],
  exports: [GrpcHealthService],
})
export class AppModule {}
