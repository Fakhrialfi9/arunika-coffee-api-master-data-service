import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MasterDataApplicationModule } from './application/master-data/master-data-application.module.js';
import { appConfig } from './config/app.config.js';
import { validateEnvironment } from './config/env.validation.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { GrpcHealthService } from './presentation/grpc/health/grpc-health.service.js';
import { MasterDataGrpcController } from './presentation/grpc/master-data.grpc.controller.js';

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
    MasterDataApplicationModule,
  ],
  controllers: [MasterDataGrpcController],
  providers: [GrpcHealthService],
  exports: [GrpcHealthService],
})
export class AppModule {}
