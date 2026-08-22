import { Injectable, Logger } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import type { Server } from '@grpc/grpc-js';
import { HealthImplementation } from 'grpc-health-check';

import { DatabaseHealthService } from '../../../infrastructure/database/database-health.service.js';

const SERVICE_NAME = 'arunika.coffee.master_data.v1.MasterDataService';
const LIVENESS = 'liveness';
const READINESS = 'readiness';
const POLL_INTERVAL_MS = 10_000;

@Injectable()
export class GrpcHealthService implements OnApplicationShutdown {
  private readonly logger = new Logger(GrpcHealthService.name);
  private healthImplementation: HealthImplementation | undefined;
  private refreshTimer: NodeJS.Timeout | undefined;
  private shuttingDown = false;

  constructor(private readonly databaseHealth: DatabaseHealthService) {}

  attach(server: Server): void {
    if (this.healthImplementation !== undefined) return;

    this.healthImplementation = new HealthImplementation({
      '': 'NOT_SERVING',
      [SERVICE_NAME]: 'NOT_SERVING',
      [LIVENESS]: 'SERVING',
      [READINESS]: 'NOT_SERVING',
    });

    this.healthImplementation.addToServer(server);
  }

  async startMonitoring(): Promise<void> {
    await this.refresh();

    if (this.shuttingDown) return;

    this.refreshTimer = setInterval(() => {
      void this.refresh();
    }, POLL_INTERVAL_MS);

    this.refreshTimer.unref();
  }

  async refresh(): Promise<void> {
    if (this.healthImplementation === undefined || this.shuttingDown) return;

    const ready = await this.databaseHealth.check();
    if (this.shuttingDown || this.healthImplementation === undefined) return;

    const status = ready ? 'SERVING' : 'NOT_SERVING';
    this.healthImplementation.setStatus(READINESS, status);
    this.healthImplementation.setStatus(SERVICE_NAME, status);
    this.healthImplementation.setStatus('', status);
  }

  onApplicationShutdown(signal?: string): void {
    this.shuttingDown = true;

    if (this.refreshTimer !== undefined) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    this.healthImplementation?.setStatus(LIVENESS, 'NOT_SERVING');
    this.healthImplementation?.setStatus(READINESS, 'NOT_SERVING');
    this.healthImplementation?.setStatus(SERVICE_NAME, 'NOT_SERVING');
    this.healthImplementation?.setStatus('', 'NOT_SERVING');

    this.logger.log(
      JSON.stringify({
        event: 'service.health.shutdown',
        signal: signal ?? 'unknown',
      }),
    );
  }
}
