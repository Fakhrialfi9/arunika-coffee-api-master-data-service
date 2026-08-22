import { describe, expect, it } from 'vitest';

import { Region } from './region.entity.js';

const base = {
  countryId: 'country-id',
  code: 'ID-JBR',
  name: 'West Java',
};

describe('Region entity', () => {
  it('creates valid defaults', () => {
    const region = Region.create(base);

    expect(region.uuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(region.countryId).toBe('country-id');
    expect(region.isActive).toBe(true);
    expect(region.sortOrder).toBe(0);
    expect(region.toPrimitives().altitudeUnit).toBe('MASL');
  });

  it('rejects a missing country relationship', () => {
    expect(() => Region.create({ ...base, countryId: ' ' })).toThrow(
      'Region countryId is required',
    );
  });

  it.each([
    ['code', { ...base, code: '' }],
    ['name', { ...base, name: ' ' }],
  ])('rejects invalid %s', (_field, props) => {
    expect(() => Region.create(props)).toThrow();
  });

  it('rejects negative or non-integer sort order', () => {
    expect(() => Region.create({ ...base, sortOrder: -1 })).toThrow(
      'Region sortOrder must be a non-negative integer',
    );
    expect(() => Region.create({ ...base, sortOrder: 2.5 })).toThrow(
      'Region sortOrder must be a non-negative integer',
    );
  });

  it('preserves explicit optional and lifecycle values', () => {
    const region = Region.create({
      ...base,
      latitude: -6.9,
      longitude: 107.6,
      altitudeUnit: null,
      isActive: false,
      sortOrder: 4,
    });

    expect(region.isActive).toBe(false);
    expect(region.sortOrder).toBe(4);
    expect(region.toPrimitives().latitude).toBe(-6.9);
    expect(region.toPrimitives().altitudeUnit).toBeNull();
  });
});
