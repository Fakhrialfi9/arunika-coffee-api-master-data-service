import { describe, expect, it } from 'vitest';

import { Country } from './country.entity.js';

const base = {
  code: 'ID',
  name: 'Indonesia',
  iso2: 'ID',
  iso3: 'IDN',
};

describe('Country entity', () => {
  it('creates valid defaults and generates a UUID', () => {
    const country = Country.create(base);

    expect(country.uuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(country.isActive).toBe(true);
    expect(country.sortOrder).toBe(0);
    expect(country.toPrimitives().createdAt).toBeInstanceOf(Date);
    expect(country.toPrimitives().updatedAt).toBeInstanceOf(Date);
  });

  it.each([
    ['code', { ...base, code: '' }],
    ['name', { ...base, name: ' '.repeat(1) }],
    ['iso2', { ...base, iso2: '' }],
    ['iso3', { ...base, iso3: '' }],
  ])('rejects invalid %s', (_field, props) => {
    expect(() => Country.create(props)).toThrow();
  });

  it('rejects negative or non-integer sort order', () => {
    expect(() => Country.create({ ...base, sortOrder: -1 })).toThrow(
      'Country sortOrder must be a non-negative integer',
    );
    expect(() => Country.create({ ...base, sortOrder: 1.5 })).toThrow(
      'Country sortOrder must be a non-negative integer',
    );
  });

  it('preserves nullable fields and explicit lifecycle values', () => {
    const country = Country.create({
      ...base,
      officialName: null,
      description: null,
      isActive: false,
      sortOrder: 3,
    });

    expect(country.isActive).toBe(false);
    expect(country.sortOrder).toBe(3);
    expect(country.toPrimitives().officialName).toBeNull();
    expect(country.toPrimitives().description).toBeNull();
  });
});
