import { describe, expect, it } from 'vitest';
import { AppModule } from './app.module.js';
import { AppService } from './app.service.js';

describe('Step 01 foundation', () => {
  it('uses AppModule as the root NestJS module', () => {
    expect(AppModule).toBeDefined();
  });

  it('keeps the default application service available', () => {
    expect(new AppService().getHello()).toBe('Hello World!');
  });
});
