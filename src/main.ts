import 'reflect-metadata';

import { join } from 'node:path';

import type { Server } from '@grpc/grpc-js';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { protoPath as healthCheckProtoPath } from 'grpc-health-check';

import { AppModule } from './app.module.js';
import { appConfig } from './config/app.config.js';
import { GrpcHealthService } from './presentation/grpc/health/grpc-health.service.js';

async function bootstrap(): Promise<void> {
  const config = appConfig();
  const logger = new Logger('Bootstrap');
  const healthServiceRef: { current?: GrpcHealthService } = {};

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'arunika.coffee.master_data.v1',
      protoPath: [
        healthCheckProtoPath,
        join(process.cwd(), 'proto/master-data/v1/master-data.proto'),
      ],
      url: `${config.grpcMasterHost}:${config.grpcMasterPort}`,
      maxReceiveMessageLength: config.securityGrpcMaxMessageBytes,
      maxSendMessageLength: config.securityGrpcMaxMessageBytes,
      onLoadPackageDefinition: (
        _packageDefinition: unknown,
        server: Server,
      ): void => {
        healthServiceRef.current?.attach(server);
      },
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  healthServiceRef.current = app.get<GrpcHealthService>(GrpcHealthService);

  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);
  await app.listen();
  await healthServiceRef.current.startMonitoring();

  if (config.logEnabled) {
    logger.log(
      JSON.stringify({
        event: 'service.started',
        service: config.otelServiceName,
        environment: config.environment,
        transport: 'grpc',
        address: `${config.grpcMasterHost}:${config.grpcMasterPort}`,
        health: {
          liveness: 'liveness',
          readiness: 'readiness',
        },
      }),
    );
  }
}

void bootstrap();
