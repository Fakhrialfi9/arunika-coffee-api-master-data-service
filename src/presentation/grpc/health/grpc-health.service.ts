import { Injectable } from '@nestjs/common';
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
  private healthImplementation: HealthImplementation | undefined;
  private refreshTimer: NodeJS.Timeout | undefined;

  constructor(private readonly databaseHealth: DatabaseHealthService) {}

  attach(server: Server): void {
    if (this.healthImplementation !== undefined) {
      return;
    }

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

    this.refreshTimer = setInterval(() => {
      void this.refresh();
    }, POLL_INTERVAL_MS);

    this.refreshTimer.unref();
  }

  async refresh(): Promise<void> {
    if (this.healthImplementation === undefined) {
      return;
    }

    const ready = await this.databaseHealth.check();
    const status = ready ? 'SERVING' : 'NOT_SERVING';

    this.healthImplementation.setStatus(READINESS, status);
    this.healthImplementation.setStatus(SERVICE_NAME, status);
    this.healthImplementation.setStatus('', status);
  }

  onApplicationShutdown(): void {
    if (this.refreshTimer !== undefined) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    this.healthImplementation?.setStatus(READINESS, 'NOT_SERVING');
    this.healthImplementation?.setStatus(SERVICE_NAME, 'NOT_SERVING');
    this.healthImplementation?.setStatus('', 'NOT_SERVING');
  }
}
