import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { MasterDataApplicationModule } from './application/master-data/master-data-application.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { appConfig } from './config/app.config.js';
import { validateEnvironment } from './config/env.validation.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { GrpcHealthService } from './presentation/grpc/health/grpc-health.service.js';
import { MasterDataGrpcExceptionFilter } from './presentation/grpc/filters/master-data.grpc-exception.filter.js';
import { GrpcObservabilityInterceptor } from './presentation/grpc/interceptors/grpc-observability.interceptor.js';
import { MasterDataGrpcController } from './presentation/grpc/master-data.grpc.controller.js';
import { OpenTelemetryLifecycleService } from './observability/opentelemetry-lifecycle.service.js';

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
  controllers: [AppController, MasterDataGrpcController],
  providers: [
    AppService,
    GrpcHealthService,
    OpenTelemetryLifecycleService,
    {
      provide: APP_FILTER,
      useClass: MasterDataGrpcExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GrpcObservabilityInterceptor,
    },
  ],
  exports: [GrpcHealthService],
})
export class AppModule {}
