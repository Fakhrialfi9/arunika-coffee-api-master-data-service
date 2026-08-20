import { describe, expect, it } from 'vitest';

import { Farm } from './farm.entity.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const FARMER_ID = 'farmer_01';

describe('Farm entity', () => {
  it('creates a farm with a UUID and database defaults', () => {
    const farm = Farm.create({
      name: 'Arunika Coffee Farm',
      farmerId: FARMER_ID,
    });

    expect(farm.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(farm.name).toBe('Arunika Coffee Farm');
    expect(farm.farmerId).toBe(FARMER_ID);
    expect(farm.areaUnit).toBe('hectare');
    expect(farm.altitudeUnit).toBe('MASL');
    expect(farm.isActive).toBe(true);
    expect(farm.sortOrder).toBe(0);
  });

  it('preserves a valid reconstituted farm and timestamps', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    const farm = Farm.reconstitute({
      uuid: UUID,
      name: 'Arunika Coffee Farm',
      farmerId: FARMER_ID,
      area: 2.5,
      areaUnit: 'hectare',
      establishedYear: 2005,
      altitudeMin: 1200,
      altitudeMax: 1400,
      altitudeUnit: 'MASL',
      latitude: -6.8,
      longitude: 107.6,
      soilType: 'volcanic',
      climate: 'tropical highland',
      farmingPractice: 'organic',
      description: 'Coffee farm',
      isActive: true,
      sortOrder: 1,
      createdAt,
      updatedAt,
    });

    expect(farm.uuid).toBe(UUID);
    expect(farm.farmerId).toBe(FARMER_ID);
    expect(farm.area).toBe(2.5);
    expect(farm.altitudeMax).toBe(1400);
    expect(farm.createdAt).toEqual(createdAt);
    expect(farm.updatedAt).toEqual(updatedAt);
  });

  it('preserves optional farm fields as null by default', () => {
    const farm = Farm.create({
      name: 'Arunika Coffee Farm',
      farmerId: FARMER_ID,
    });

    expect(farm.area).toBeNull();
    expect(farm.establishedYear).toBeNull();
    expect(farm.altitudeMin).toBeNull();
    expect(farm.altitudeMax).toBeNull();
    expect(farm.latitude).toBeNull();
    expect(farm.longitude).toBeNull();
    expect(farm.soilType).toBeNull();
    expect(farm.climate).toBeNull();
    expect(farm.farmingPractice).toBeNull();
    expect(farm.description).toBeNull();
  });

  it('rejects invalid UUIDs and required farm fields', () => {
    expect(() =>
      Farm.create({
        uuid: 'invalid',
        name: 'Arunika Coffee Farm',
        farmerId: FARMER_ID,
      }),
    ).toThrow('Farm uuid must be a valid UUID');

    expect(() =>
      Farm.create({
        name: '   ',
        farmerId: FARMER_ID,
      }),
    ).toThrow('Farm name must contain between 1 and 191 characters');
  });

  it('rejects required strings that exceed the database contract length', () => {
    expect(() =>
      Farm.create({
        name: 'A'.repeat(192),
        farmerId: FARMER_ID,
      }),
    ).toThrow('Farm name must contain between 1 and 191 characters');
  });
});
