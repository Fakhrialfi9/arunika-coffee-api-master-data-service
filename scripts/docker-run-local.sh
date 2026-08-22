#!/usr/bin/env sh

set -eu

IMAGE_NAME="${IMAGE_NAME:-arunika-coffee-api-master-data-service:latest}"
CONTAINER_NAME="${CONTAINER_NAME:-arunika-coffee-api-master-data-service}"
DATABASE_URL="${DATABASE_URL:-mysql://dev:dev123@host.docker.internal:3306/arunika_coffee_master_data}"

if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

docker run -d \
  --name "$CONTAINER_NAME" \
  -p 3000:3000 \
  -p 50053:50053 \
  -e NODE_ENV=development \
  -e APP_NAME=arunika-coffee-api-master-data-service \
  -e APP_HOST=0.0.0.0 \
  -e APP_PORT=3000 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_PORT=3306 \
  -e DATABASE_NAME=arunika_coffee_master_data \
  -e DATABASE_USER=dev \
  -e DATABASE_PASSWORD=dev123 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e DATABASE_POOL_CONNECTION_LIMIT=10 \
  -e DATABASE_CONNECT_TIMEOUT_MS=5000 \
  -e DATABASE_ACQUIRE_TIMEOUT_MS=10000 \
  -e DATABASE_POOL_IDLE_TIMEOUT_SEC=300 \
  -e GRPC_MASTER_HOST=0.0.0.0 \
  -e GRPC_MASTER_PORT=50053 \
  -e MASTER_GRPC_TIMEOUT_MS=3000 \
  -e SECURITY_CORS_ORIGINS=http://localhost:3000 \
  -e SECURITY_RATE_LIMIT_TTL=60000 \
  -e SECURITY_RATE_LIMIT_MAX=100 \
  -e SECURITY_BODY_LIMIT=1mb \
  -e SECURITY_GRPC_MAX_MESSAGE_BYTES=1048576 \
  -e SECURITY_TRUST_PROXY=loopback \
  -e LOG_ENABLED=true \
  -e LOG_LEVEL=debug \
  -e OTEL_SERVICE_NAME=arunika-coffee-api-master-data-service \
  -e OTEL_TRACING_ENABLED=true \
  -e OTEL_TRACES_SAMPLER_ARG=1 \
  -e OTEL_METRICS_ENABLED=true \
  -e OTEL_METRIC_EXPORT_INTERVAL=60000 \
  "$IMAGE_NAME"

docker logs --tail=50 "$CONTAINER_NAME"
