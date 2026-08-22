import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes } from '@opentelemetry/resources';

import { appConfig, type AppConfig } from '../../config/app.config.js';

@Injectable()
export class OpenTelemetryLifecycleService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly sdk: NodeSDK;
  private started = false;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.getOrThrow<AppConfig>(appConfig.KEY);

    this.sdk = new NodeSDK({
      autoDetectResources: false,
      resource: resourceFromAttributes({
        'service.name': config.otelServiceName,
        'deployment.environment.name': config.environment,
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    });
  }

  onModuleInit(): void {
    const config = this.configService.getOrThrow<AppConfig>(appConfig.KEY);

    if (config.otelTracingEnabled || config.otelMetricsEnabled) {
      this.sdk.start();
      this.started = true;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (!this.started) return;

    await this.sdk.shutdown();
    this.started = false;
  }
}
