import { randomUUID } from 'node:crypto';

import { Catch, Logger } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { RpcExceptionFilter } from '@nestjs/common';
import { Metadata, status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

import {
  MasterDataNotFoundError,
  MasterDataValidationError,
} from '../../../application/master-data/errors/master-data.errors.js';
import {
  RepositoryBusinessRuleError,
  RepositoryForeignKeyError,
  RepositoryNotFoundError,
  RepositoryPersistenceError,
  RepositoryUniqueConstraintError,
} from '../../../infrastructure/database/errors/repository.error.js';

interface GrpcCallContext {
  metadata?: Metadata;
}

interface MappedGrpcError {
  code: number;
  message: string;
  category: string;
}

@Catch()
export class MasterDataGrpcExceptionFilter implements RpcExceptionFilter<unknown> {
  private readonly logger = new Logger(MasterDataGrpcExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const call = host.switchToRpc().getContext<GrpcCallContext>();
    const requestId = this.requestId(call?.metadata);
    const mapped = this.map(exception);

    this.logger.error(
      JSON.stringify({
        event: 'grpc.request.error',
        requestId,
        code: mapped.code,
        category: mapped.category,
      }),
    );

    const metadata = new Metadata();
    metadata.set('x-request-id', requestId);

    return throwError(
      () =>
        new RpcException({
          code: mapped.code,
          message: mapped.message,
          metadata,
        }),
    );
  }

  private map(exception: unknown): MappedGrpcError {
    if (exception instanceof MasterDataNotFoundError) {
      return {
        code: status.NOT_FOUND,
        message: exception.message,
        category: 'not_found',
      };
    }

    if (exception instanceof MasterDataValidationError) {
      return {
        code: status.INVALID_ARGUMENT,
        message: exception.message,
        category: 'validation',
      };
    }

    if (exception instanceof RepositoryNotFoundError) {
      return {
        code: status.NOT_FOUND,
        message: 'Master data record not found',
        category: 'repository_not_found',
      };
    }

    if (exception instanceof RepositoryUniqueConstraintError) {
      return {
        code: status.ALREADY_EXISTS,
        message: 'Master data record conflicts with an existing unique value',
        category: 'conflict',
      };
    }

    if (exception instanceof RepositoryForeignKeyError) {
      return {
        code: status.FAILED_PRECONDITION,
        message: 'Master data relationship is invalid',
        category: 'foreign_key',
      };
    }

    if (exception instanceof RepositoryBusinessRuleError) {
      return {
        code: status.FAILED_PRECONDITION,
        message: 'Master data business rule was not satisfied',
        category: 'business_rule',
      };
    }

    if (exception instanceof RepositoryPersistenceError) {
      return {
        code: status.INTERNAL,
        message: 'Internal server error',
        category: 'persistence',
      };
    }

    return {
      code: status.INTERNAL,
      message: 'Internal server error',
      category: 'internal',
    };
  }

  private requestId(metadata?: Metadata): string {
    const value = metadata?.get('x-request-id')?.[0];
    if (typeof value === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(value)) {
      return value;
    }

    return randomUUID();
  }
}
