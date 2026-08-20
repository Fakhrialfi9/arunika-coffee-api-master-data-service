import { describe, expect, it } from 'vitest';

import { CoffeeGrade } from './coffee-grade.entity.js';

describe('CoffeeGrade entity', () => {
  it('creates a coffee grade with a UUID and defaults', () => {
    const entity = CoffeeGrade.create({
      code: 'SPECIALTY',
      name: 'Specialty Grade',
    });

    expect(entity.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(entity.exportEligible).toBe(false);
    expect(entity.isActive).toBe(true);
    expect(entity.sortOrder).toBe(0);
  });

  it('preserves quality attributes and timestamps', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    const entity = CoffeeGrade.reconstitute({
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      code: 'G80',
      name: 'Grade 80+',
      category: 'Specialty',
      standard: 'SCA',
      minimumCuppingScore: 80,
      maxDefectCount: 5,
      exportEligible: true,
      description: 'Export quality grade',
      isActive: true,
      sortOrder: 1,
      createdAt,
      updatedAt,
    });

    expect(entity.category).toBe('Specialty');
    expect(entity.standard).toBe('SCA');
    expect(entity.minimumCuppingScore).toBe(80);
    expect(entity.maxDefectCount).toBe(5);
    expect(entity.exportEligible).toBe(true);
    expect(entity.createdAt).toEqual(createdAt);
    expect(entity.updatedAt).toEqual(updatedAt);
  });

  it('preserves optional quality fields as null by default', () => {
    const entity = CoffeeGrade.create({
      code: 'COMMERCIAL',
      name: 'Commercial Grade',
    });

    expect(entity.category).toBeNull();
    expect(entity.standard).toBeNull();
    expect(entity.minimumCuppingScore).toBeNull();
    expect(entity.maxDefectCount).toBeNull();
    expect(entity.description).toBeNull();
  });

  it('rejects invalid UUIDs and required fields', () => {
    expect(() => CoffeeGrade.create({ code: '', name: 'Grade' })).toThrow();
    expect(() => CoffeeGrade.create({ code: 'G80', name: '' })).toThrow();
    expect(() =>
      CoffeeGrade.reconstitute({
        uuid: 'invalid',
        code: 'G80',
        name: 'Grade 80+',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it('rejects required strings that exceed the database contract length', () => {
    expect(() =>
      CoffeeGrade.create({ code: 'G'.repeat(192), name: 'Grade' }),
    ).toThrow();
    expect(() =>
      CoffeeGrade.create({ code: 'G80', name: 'G'.repeat(192) }),
    ).toThrow();
  });
});
