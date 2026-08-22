import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import type { Metadata } from '@grpc/grpc-js';
import { metrics, trace } from '@opentelemetry/api';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

interface GrpcCallContext {
  metadata?: Metadata;
}

const REQUEST_ID_HEADER = 'x-request-id';
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

@Injectable()
export class GrpcObservabilityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GrpcObservabilityInterceptor.name);
  private readonly tracer = trace.getTracer('arunika-coffee-api-master-data-service');
  private readonly meter = metrics.getMeter('arunika-coffee-api-master-data-service');
  private readonly requestCounter = this.meter.createCounter('grpc.server.requests');
  private readonly requestDuration = this.meter.createHistogram('grpc.server.duration_ms');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const call = context.switchToRpc().getContext<GrpcCallContext>();
    const requestId = this.resolveRequestId(call?.metadata);
    const rpcName = context.getHandler().name || 'unknown';
    const startedAt = Date.now();
    const span = this.tracer.startSpan(`grpc.${rpcName}`);

    span.setAttribute('service.name', 'arunika-coffee-api-master-data-service');
    span.setAttribute('rpc.system', 'grpc');
    span.setAttribute('rpc.method', rpcName);
    span.setAttribute('request.id', requestId);

    if (process.env.LOG_ENABLED !== 'false') {
      this.logger.log(
        JSON.stringify({
          event: 'grpc.request.started',
          requestId,
          rpc: rpcName,
        }),
      );
    }

    return next.handle().pipe(
      finalize(() => {
        const durationMs = Date.now() - startedAt;
        this.requestCounter.add(1, { rpc: rpcName });
        this.requestDuration.record(durationMs, { rpc: rpcName });
        span.setAttribute('rpc.duration_ms', durationMs);
        span.end();

        if (process.env.LOG_ENABLED !== 'false') {
          this.logger.log(
            JSON.stringify({
              event: 'grpc.request.completed',
              requestId,
              rpc: rpcName,
              durationMs,
            }),
          );
        }
      }),
    );
  }

  private resolveRequestId(metadata?: Metadata): string {
    const value = metadata?.get(REQUEST_ID_HEADER)?.[0];
    if (typeof value === 'string' && REQUEST_ID_PATTERN.test(value)) {
      return value;
    }

    return randomUUID();
  }
}
