import { describe, expect, it } from 'vitest';

import { CoffeeBean } from './coffee-bean.entity.js';

const base = {
  code: 'BEAN-01',
  name: 'Washed Arabica',
  regionId: 'region-id',
  speciesId: 'species-id',
  processingMethodId: 'processing-id',
};

describe('CoffeeBean entity', () => {
  it('creates valid defaults and keeps nullable relationships nullable', () => {
    const bean = CoffeeBean.create(base);

    expect(bean.uuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(bean.regionId).toBe('region-id');
    expect(bean.speciesId).toBe('species-id');
    expect(bean.processingMethodId).toBe('processing-id');
    expect(bean.varietyId).toBeNull();
    expect(bean.farmerId).toBeNull();
    expect(bean.farmId).toBeNull();
    expect(bean.toPrimitives().weightUnit).toBe('kg');
    expect(bean.toPrimitives().isFeatured).toBe(false);
    expect(bean.toPrimitives().isActive).toBe(true);
    expect(bean.toPrimitives().sortOrder).toBe(0);
  });

  it.each([
    'code',
    'name',
    'regionId',
    'speciesId',
    'processingMethodId',
  ] as const)('rejects a missing required %s', (field) => {
    expect(() => CoffeeBean.create({ ...base, [field]: '' })).toThrow(
      `CoffeeBean ${field} is required`,
    );
  });

  it('accepts JSON values and explicit nullable relationships', () => {
    const bean = CoffeeBean.create({
      ...base,
      varietyId: 'variety-id',
      farmerId: null,
      farmId: 'farm-id',
      flavorProfiles: ['cocoa', { family: 'sweet' }],
      aromaNotes: ['caramel'],
      isActive: false,
      isFeatured: true,
      sortOrder: 2,
    });

    expect(bean.varietyId).toBe('variety-id');
    expect(bean.farmerId).toBeNull();
    expect(bean.farmId).toBe('farm-id');
    expect(bean.toPrimitives().flavorProfiles).toEqual([
      'cocoa',
      { family: 'sweet' },
    ]);
    expect(bean.toPrimitives().aromaNotes).toEqual(['caramel']);
    expect(bean.toPrimitives().isActive).toBe(false);
    expect(bean.toPrimitives().isFeatured).toBe(true);
  });

  it('rejects invalid sort order', () => {
    expect(() => CoffeeBean.create({ ...base, sortOrder: -1 })).toThrow(
      'CoffeeBean sortOrder must be a non-negative integer',
    );
    expect(() => CoffeeBean.create({ ...base, sortOrder: 1.5 })).toThrow(
      'CoffeeBean sortOrder must be a non-negative integer',
    );
  });
});
