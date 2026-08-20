import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import {
  RepositoryBusinessRuleError,
  RepositoryForeignKeyError,
  RepositoryNotFoundError,
  RepositoryPersistenceError,
  RepositoryUniqueConstraintError,
} from '../errors/repository.error.js';
import { PrismaTransactionService } from '../prisma-transaction.service.js';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export abstract class PrismaBaseRepository {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly transactions: PrismaTransactionService,
  ) {}

  protected async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  protected async executeTransaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.transactions.run(operation);
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  protected mapPersistenceError(error: unknown): Error {
    if (
      error instanceof RepositoryPersistenceError ||
      error instanceof RepositoryNotFoundError ||
      error instanceof RepositoryUniqueConstraintError ||
      error instanceof RepositoryForeignKeyError ||
      error instanceof RepositoryBusinessRuleError
    ) {
      return error;
    }

    const code = this.prismaErrorCode(error);

    if (code === 'P2002') {
      return new RepositoryUniqueConstraintError(
        this.prismaErrorTarget(error),
        error,
      );
    }

    if (code === 'P2003' || code === 'P2014') {
      return new RepositoryForeignKeyError(
        this.prismaForeignKeyTarget(error),
        error,
      );
    }

    if (code === 'P2025') {
      return new RepositoryNotFoundError(error);
    }

    return new RepositoryPersistenceError(error);
  }

  private prismaErrorCode(error: unknown): string | undefined {
    return typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
      ? error.code
      : undefined;
  }

  private prismaErrorTarget(error: unknown): string[] {
    if (
      typeof error === 'object' &&
      error !== null &&
      'meta' in error &&
      typeof error.meta === 'object' &&
      error.meta !== null &&
      'target' in error.meta
    ) {
      const target = error.meta.target;
      return Array.isArray(target) ? target.map(String) : [String(target)];
    }

    return ['unknown'];
  }

  private prismaForeignKeyTarget(error: unknown): string[] {
    if (
      typeof error === 'object' &&
      error !== null &&
      'meta' in error &&
      typeof error.meta === 'object' &&
      error.meta !== null &&
      'field_name' in error.meta
    ) {
      const field = error.meta.field_name;
      return Array.isArray(field) ? field.map(String) : [String(field)];
    }

    return ['unknown'];
  }
}
