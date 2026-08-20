import { describe, expect, it } from 'vitest';

import { FlavorProfile } from './flavor-profile.entity.js';

describe('FlavorProfile entity', () => {
  it('creates a flavor profile with a UUID and database defaults', () => {
    const flavorProfile = FlavorProfile.create({
      code: 'CHOCOLATE',
      name: 'Chocolate',
    });

    expect(flavorProfile.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(flavorProfile.code).toBe('CHOCOLATE');
    expect(flavorProfile.name).toBe('Chocolate');
    expect(flavorProfile.category).toBeNull();
    expect(flavorProfile.description).toBeNull();
    expect(flavorProfile.isActive).toBe(true);
    expect(flavorProfile.sortOrder).toBe(0);
  });

  it('preserves category, description, active state, and sort order', () => {
    const flavorProfile = FlavorProfile.create({
      code: 'CITRUS-ORANGE',
      name: 'Orange',
      category: 'Fruity',
      description: 'Bright citrus-like flavor note',
      isActive: false,
      sortOrder: 4,
    });

    expect(flavorProfile.code).toBe('CITRUS-ORANGE');
    expect(flavorProfile.name).toBe('Orange');
    expect(flavorProfile.category).toBe('Fruity');
    expect(flavorProfile.description).toBe('Bright citrus-like flavor note');
    expect(flavorProfile.isActive).toBe(false);
    expect(flavorProfile.sortOrder).toBe(4);
  });

  it('supports reconstituting persisted flavor profiles', () => {
    const createdAt = new Date('2026-08-20T08:00:00.000Z');
    const updatedAt = new Date('2026-08-20T09:00:00.000Z');
    const uuid = '8f5b0d5a-1d88-4b16-8b2f-8e9f2d4f6a31';

    const flavorProfile = FlavorProfile.reconstitute({
      uuid,
      code: 'CARAMEL',
      name: 'Caramel',
      category: 'Sweet',
      description: null,
      isActive: true,
      sortOrder: 2,
      createdAt,
      updatedAt,
    });

    expect(flavorProfile.uuid).toBe(uuid);
    expect(flavorProfile.createdAt).toEqual(createdAt);
    expect(flavorProfile.updatedAt).toEqual(updatedAt);
  });

  it('rejects invalid UUIDs, required strings, and sort order', () => {
    expect(() =>
      FlavorProfile.create({
        uuid: 'not-a-uuid',
        code: 'VALID',
        name: 'Valid Flavor',
      }),
    ).toThrow('uuid must be a valid UUID');

    expect(() =>
      FlavorProfile.create({
        code: ' ',
        name: 'Valid Flavor',
      }),
    ).toThrow('code must contain between 1 and 191 characters');

    expect(() =>
      FlavorProfile.create({
        code: 'VALID',
        name: ' ',
      }),
    ).toThrow('name must contain between 1 and 191 characters');

    expect(() =>
      FlavorProfile.create({
        code: 'VALID',
        name: 'Valid Flavor',
        sortOrder: -1,
      }),
    ).toThrow('sortOrder must be a non-negative integer');
  });

  it('rejects strings that exceed database column length', () => {
    expect(() =>
      FlavorProfile.create({
        code: 'A'.repeat(192),
        name: 'Valid Flavor',
      }),
    ).toThrow('code must contain between 1 and 191 characters');

    expect(() =>
      FlavorProfile.create({
        code: 'VALID',
        name: 'Valid Flavor',
        category: 'A'.repeat(192),
      }),
    ).toThrow('category must not exceed 191 characters');

    expect(() =>
      FlavorProfile.create({
        code: 'VALID',
        name: 'Valid Flavor',
        description: 'A'.repeat(192),
      }),
    ).toThrow('description must not exceed 191 characters');
  });
});
