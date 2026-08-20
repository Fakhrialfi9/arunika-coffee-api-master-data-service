import { describe, expect, it } from 'vitest';

import { Species } from './species.entity.js';

describe('Species entity', () => {
  it('creates a species with a UUID and default state', () => {
    const species = Species.create({
      code: 'ARABICA',
      name: 'Arabica',
    });

    expect(species.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(species.isActive).toBe(true);
    expect(species.sortOrder).toBe(0);
  });

  it('preserves a valid reconstituted species and timestamps', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    const species = Species.reconstitute({
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      code: 'ROBUSTA',
      name: 'Robusta',
      commonName: 'Canephora',
      scientificName: 'Coffea canephora',
      originRegion: 'Central Africa',
      createdAt,
      updatedAt,
    });

    expect(species.code).toBe('ROBUSTA');
    expect(species.commonName).toBe('Canephora');
    expect(species.scientificName).toBe('Coffea canephora');
    expect(species.createdAt).toEqual(createdAt);
    expect(species.updatedAt).toEqual(updatedAt);
  });

  it('preserves optional species fields as null by default', () => {
    const species = Species.create({
      code: 'LIBERICA',
      name: 'Liberica',
    });

    expect(species.commonName).toBeNull();
    expect(species.scientificName).toBeNull();
    expect(species.originRegion).toBeNull();
    expect(species.description).toBeNull();
  });

  it('rejects invalid UUIDs and required species fields', () => {
    expect(() =>
      Species.reconstitute({
        uuid: 'invalid',
        code: 'ARABICA',
        name: 'Arabica',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow('Species uuid must be a valid UUID');

    expect(() => Species.create({ code: '', name: 'Arabica' })).toThrow(
      'Species code must contain between 1 and 191 characters',
    );

    expect(() => Species.create({ code: 'ARABICA', name: '   ' })).toThrow(
      'Species name must contain between 1 and 191 characters',
    );
  });

  it('rejects required strings that exceed the database contract length', () => {
    const value = 'a'.repeat(192);

    expect(() => Species.create({ code: value, name: 'Arabica' })).toThrow(
      'Species code must contain between 1 and 191 characters',
    );
    expect(() => Species.create({ code: 'ARABICA', name: value })).toThrow(
      'Species name must contain between 1 and 191 characters',
    );
  });
});
