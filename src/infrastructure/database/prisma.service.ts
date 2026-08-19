import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../../../prisma/generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    const url = new URL(databaseUrl);
    const database = url.pathname.replace(/^\//, '');

    if (!url.hostname || !database) {
      throw new Error('DATABASE_URL is invalid');
    }

    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port || process.env.DATABASE_PORT || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
      connectionLimit: Number(process.env.DATABASE_POOL_CONNECTION_LIMIT ?? 10),
      connectTimeout: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 5000),
      acquireTimeout: Number(process.env.DATABASE_ACQUIRE_TIMEOUT_MS ?? 10000),
      idleTimeout: Number(process.env.DATABASE_POOL_IDLE_TIMEOUT_SEC ?? 300),
    });

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.$queryRaw`SELECT 1`;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
