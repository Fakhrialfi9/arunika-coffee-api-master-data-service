import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.spec.ts',
      'test/unit/**/*.spec.ts',
      'test/grpc/**/*.spec.ts',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'test/e2e/**',
      'test/integration/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', 'coverage/', 'test/', '**/*.d.ts'],
    },
  },
});
