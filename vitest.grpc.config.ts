import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/grpc/**/*.spec.ts'],
    setupFiles: ['./test/grpc/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
