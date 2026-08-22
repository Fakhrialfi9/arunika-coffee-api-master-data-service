import process from 'node:process';

import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { protoPath } from 'grpc-health-check';

const host =
  process.env.GRPC_MASTER_HOST === '0.0.0.0'
    ? '127.0.0.1'
    : (process.env.GRPC_MASTER_HOST ?? '127.0.0.1');
const port = process.env.GRPC_MASTER_PORT ?? '50053';
const target = `${host}:${port}`;

const definition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const loaded = grpc.loadPackageDefinition(definition);
const healthPackage = loaded.grpc?.health?.v1;
const HealthClient = healthPackage?.Health;

if (!HealthClient) {
  process.stderr.write('gRPC health client is unavailable\n');
  process.exit(1);
}

const client = new HealthClient(target, grpc.credentials.createInsecure());
const deadline = new Date(Date.now() + 4000);

client.check(
  { service: 'liveness' },
  (error, response) => {
    client.close();

    if (error || (response?.status !== 'SERVING' && response?.status !== 1)) {
      process.exit(1);
    }

    process.exit(0);
  },
  { deadline },
);
