import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules/**', 'dist/**', 'test/**'],

    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    testTimeout: 15_000,
    hookTimeout: 15_000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],

      include: ['src/**/*.ts'],

      exclude: [
        'src/main.ts',
        'src/app.module.ts',
        'src/app.controller.ts',
        'src/app.service.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
      ],

      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
