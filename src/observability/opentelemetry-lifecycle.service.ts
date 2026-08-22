import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes } from '@opentelemetry/resources';

import { appConfig } from '../../config/app.config.js';

@Injectable()
export class OpenTelemetryLifecycleService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly sdk: NodeSDK;
  private started = false;

  constructor() {
    const config = appConfig();
    this.sdk = new NodeSDK({
      autoDetectResources: false,
      resource: resourceFromAttributes({
        'service.name': config.name,
        'deployment.environment.name': config.environment,
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    });
  }

  onModuleInit(): void {
    const config = appConfig();
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
