import { describe, expect, it } from 'vitest';

import { Variety } from './variety.entity.js';

describe('Variety entity', () => {
  it('creates a variety with a UUID and default state', () => {
    const variety = Variety.create({
      speciesId: 'species-id',
      code: 'CATURRA',
      name: 'Caturra',
    });

    expect(variety.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(variety.isActive).toBe(true);
    expect(variety.sortOrder).toBe(0);
  });

  it('preserves species relationship and optional characteristics', () => {
    const plantCharacteristics = { height: 'medium' };
    const flavorCharacteristics = { acidity: 'bright' };
    const variety = Variety.create({
      speciesId: 'species-id',
      code: 'GEISHA',
      name: 'Geisha',
      geneticBackground: 'Ethiopian landrace',
      originCountry: 'Ethiopia',
      plantCharacteristics,
      flavorCharacteristics,
    });

    expect(variety.speciesId).toBe('species-id');
    expect(variety.geneticBackground).toBe('Ethiopian landrace');
    expect(variety.originCountry).toBe('Ethiopia');
    expect(variety.plantCharacteristics).toEqual(plantCharacteristics);
    expect(variety.flavorCharacteristics).toEqual(flavorCharacteristics);
  });

  it('preserves optional variety fields as null by default', () => {
    const variety = Variety.create({
      speciesId: 'species-id',
      code: 'BOURBON',
      name: 'Bourbon',
    });

    expect(variety.geneticBackground).toBeNull();
    expect(variety.originCountry).toBeNull();
    expect(variety.plantCharacteristics).toBeNull();
    expect(variety.flavorCharacteristics).toBeNull();
    expect(variety.description).toBeNull();
  });

  it('rejects invalid UUIDs and required variety fields', () => {
    expect(() =>
      Variety.reconstitute({
        uuid: 'invalid',
        speciesId: 'species-id',
        code: 'CATURRA',
        name: 'Caturra',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow('Variety uuid must be a valid UUID');

    expect(() =>
      Variety.create({ speciesId: '', code: 'CATURRA', name: 'Caturra' }),
    ).toThrow('Variety speciesId must contain between 1 and 191 characters');

    expect(() =>
      Variety.create({ speciesId: 'species-id', code: '', name: 'Caturra' }),
    ).toThrow('Variety code must contain between 1 and 191 characters');

    expect(() =>
      Variety.create({ speciesId: 'species-id', code: 'CATURRA', name: '   ' }),
    ).toThrow('Variety name must contain between 1 and 191 characters');
  });

  it('rejects required strings that exceed the database contract length', () => {
    const value = 'a'.repeat(192);

    expect(() =>
      Variety.create({ speciesId: value, code: 'CATURRA', name: 'Caturra' }),
    ).toThrow('Variety speciesId must contain between 1 and 191 characters');
    expect(() =>
      Variety.create({ speciesId: 'species-id', code: value, name: 'Caturra' }),
    ).toThrow('Variety code must contain between 1 and 191 characters');
    expect(() =>
      Variety.create({ speciesId: 'species-id', code: 'CATURRA', name: value }),
    ).toThrow('Variety name must contain between 1 and 191 characters');
  });
});
