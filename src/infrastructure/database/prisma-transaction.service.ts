import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../prisma/generated/prisma/client.js';

import { PrismaService } from './prisma.service.js';

@Injectable()
export class PrismaTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(operation);
  }
}
