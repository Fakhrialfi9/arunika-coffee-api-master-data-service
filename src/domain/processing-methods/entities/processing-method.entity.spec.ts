import { describe, expect, it } from 'vitest';

import { ProcessingMethod } from './processing-method.entity.js';

describe('ProcessingMethod entity', () => {
  it('creates a processing method with a UUID and defaults', () => {
    const entity = ProcessingMethod.create({
      code: 'WASHED',
      name: 'Washed',
    });

    expect(entity.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(entity.fermentation).toBe(false);
    expect(entity.isActive).toBe(true);
    expect(entity.sortOrder).toBe(0);
  });

  it('preserves processing attributes and timestamps', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    const entity = ProcessingMethod.reconstitute({
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      code: 'NATURAL',
      name: 'Natural',
      category: 'Dry Process',
      fermentation: true,
      fermentationType: 'Anaerobic',
      fermentationDuration: '72 hours',
      dryingMethod: 'Raised beds',
      dryingDuration: '20 days',
      processingSteps: ['sorting', 'drying'],
      parameters: { temperature: 24 },
      description: 'Natural process',
      isActive: true,
      sortOrder: 2,
      createdAt,
      updatedAt,
    });

    expect(entity.category).toBe('Dry Process');
    expect(entity.fermentationType).toBe('Anaerobic');
    expect(entity.processingSteps).toEqual(['sorting', 'drying']);
    expect(entity.parameters).toEqual({ temperature: 24 });
    expect(entity.createdAt).toEqual(createdAt);
    expect(entity.updatedAt).toEqual(updatedAt);
  });

  it('preserves optional processing fields as null by default', () => {
    const entity = ProcessingMethod.create({
      code: 'HONEY',
      name: 'Honey',
    });

    expect(entity.category).toBeNull();
    expect(entity.fermentationType).toBeNull();
    expect(entity.fermentationDuration).toBeNull();
    expect(entity.dryingMethod).toBeNull();
    expect(entity.dryingDuration).toBeNull();
    expect(entity.processingSteps).toBeNull();
    expect(entity.parameters).toBeNull();
    expect(entity.description).toBeNull();
  });

  it('rejects invalid UUIDs and required fields', () => {
    expect(() =>
      ProcessingMethod.create({ code: '', name: 'Washed' }),
    ).toThrow();
    expect(() =>
      ProcessingMethod.create({ code: 'WASHED', name: '' }),
    ).toThrow();
    expect(() =>
      ProcessingMethod.reconstitute({
        uuid: 'invalid',
        code: 'WASHED',
        name: 'Washed',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it('rejects required strings that exceed the database contract length', () => {
    expect(() =>
      ProcessingMethod.create({ code: 'W'.repeat(192), name: 'Washed' }),
    ).toThrow();
    expect(() =>
      ProcessingMethod.create({ code: 'WASHED', name: 'W'.repeat(192) }),
    ).toThrow();
  });
});
