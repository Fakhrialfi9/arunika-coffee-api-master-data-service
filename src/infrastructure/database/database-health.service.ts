import { Injectable } from '@nestjs/common';

import { PrismaService } from './prisma.service.js';

const HEALTH_TIMEOUT_MS = 2000;

@Injectable()
export class DatabaseHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(timeoutMs = HEALTH_TIMEOUT_MS): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;

    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Database health check timed out')),
            timeoutMs,
          );
          timer.unref();
        }),
      ]);
      return true;
    } catch {
      return false;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }
}
