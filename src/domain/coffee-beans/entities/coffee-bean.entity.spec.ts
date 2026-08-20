import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { CoffeeBean } from './coffee-bean.entity.js';

describe('CoffeeBean entity', () => {
  const relationshipIds = {
    regionId: randomUUID(),
    farmerId: randomUUID(),
    farmId: randomUUID(),
    speciesId: randomUUID(),
    varietyId: randomUUID(),
    processingMethodId: randomUUID(),
    gradeId: randomUUID(),
    harvestSeasonId: randomUUID(),
  };

  it('creates a coffee bean with a UUID and database defaults', () => {
    const coffeeBean = CoffeeBean.create({
      code: 'BEAN-001',
      name: 'Aceh Gayo Arabica',
      ...relationshipIds,
    });

    expect(coffeeBean.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(coffeeBean.weightUnit).toBe('kg');
    expect(coffeeBean.isFeatured).toBe(false);
    expect(coffeeBean.isActive).toBe(true);
    expect(coffeeBean.sortOrder).toBe(0);
  });

  it('preserves coffee attributes and all relationship references', () => {
    const coffeeBean = CoffeeBean.create({
      uuid: randomUUID(),
      code: 'BEAN-002',
      lotNumber: 'LOT-2026-001',
      name: 'West Java Natural',
      description: 'Specialty coffee lot',
      ...relationshipIds,
      cuppingScore: 87.5,
      moisture: 10.2,
      density: 0.72,
      beanSize: '16+',
      qualityStatus: 'export-ready',
      flavorProfiles: ['chocolate', 'caramel'],
      aromaNotes: ['jasmine', 'citrus'],
      availableWeight: 1200,
      reservedWeight: 200,
      weightUnit: 'kg',
      isFeatured: true,
      isActive: false,
      sortOrder: 3,
    });

    expect(coffeeBean.regionId).toBe(relationshipIds.regionId);
    expect(coffeeBean.farmerId).toBe(relationshipIds.farmerId);
    expect(coffeeBean.farmId).toBe(relationshipIds.farmId);
    expect(coffeeBean.speciesId).toBe(relationshipIds.speciesId);
    expect(coffeeBean.varietyId).toBe(relationshipIds.varietyId);
    expect(coffeeBean.processingMethodId).toBe(
      relationshipIds.processingMethodId,
    );
    expect(coffeeBean.gradeId).toBe(relationshipIds.gradeId);
    expect(coffeeBean.harvestSeasonId).toBe(relationshipIds.harvestSeasonId);
    expect(coffeeBean.cuppingScore).toBe(87.5);
    expect(coffeeBean.moisture).toBe(10.2);
    expect(coffeeBean.density).toBe(0.72);
    expect(coffeeBean.flavorProfiles).toEqual(['chocolate', 'caramel']);
    expect(coffeeBean.aromaNotes).toEqual(['jasmine', 'citrus']);
    expect(coffeeBean.availableWeight).toBe(1200);
    expect(coffeeBean.reservedWeight).toBe(200);
    expect(coffeeBean.isFeatured).toBe(true);
    expect(coffeeBean.isActive).toBe(false);
    expect(coffeeBean.sortOrder).toBe(3);
  });

  it('supports reconstituting a persisted coffee bean', () => {
    const createdAt = new Date('2026-08-20T00:00:00.000Z');
    const updatedAt = new Date('2026-08-20T01:00:00.000Z');
    const uuid = randomUUID();

    const coffeeBean = CoffeeBean.reconstitute({
      uuid,
      code: 'BEAN-003',
      name: 'Flores Bajawa',
      regionId: relationshipIds.regionId,
      speciesId: relationshipIds.speciesId,
      processingMethodId: relationshipIds.processingMethodId,
      createdAt,
      updatedAt,
    });

    expect(coffeeBean.uuid).toBe(uuid);
    expect(coffeeBean.createdAt).toEqual(createdAt);
    expect(coffeeBean.updatedAt).toEqual(updatedAt);
    expect(coffeeBean.farmerId).toBeNull();
    expect(coffeeBean.farmId).toBeNull();
    expect(coffeeBean.varietyId).toBeNull();
    expect(coffeeBean.gradeId).toBeNull();
    expect(coffeeBean.harvestSeasonId).toBeNull();
  });

  it('rejects invalid identity, relationship references, and numeric values', () => {
    expect(() =>
      CoffeeBean.create({
        uuid: 'invalid',
        code: 'BEAN-004',
        name: 'Invalid',
        regionId: relationshipIds.regionId,
        speciesId: relationshipIds.speciesId,
        processingMethodId: relationshipIds.processingMethodId,
      }),
    ).toThrow('CoffeeBean uuid must be a valid UUID');

    expect(() =>
      CoffeeBean.create({
        code: 'BEAN-005',
        name: 'Invalid',
        regionId: '',
        speciesId: relationshipIds.speciesId,
        processingMethodId: relationshipIds.processingMethodId,
      }),
    ).toThrow('CoffeeBean regionId must contain between 1 and 191 characters');

    expect(() =>
      CoffeeBean.create({
        code: 'BEAN-006',
        name: 'Invalid',
        regionId: relationshipIds.regionId,
        speciesId: relationshipIds.speciesId,
        processingMethodId: relationshipIds.processingMethodId,
        cuppingScore: Number.NaN,
      }),
    ).toThrow('CoffeeBean cuppingScore must be a finite number');

    expect(() =>
      CoffeeBean.create({
        code: 'BEAN-007',
        name: 'Invalid',
        regionId: relationshipIds.regionId,
        speciesId: relationshipIds.speciesId,
        processingMethodId: relationshipIds.processingMethodId,
        sortOrder: -1,
      }),
    ).toThrow('CoffeeBean sortOrder must be a non-negative integer');
  });

  it('rejects strings that exceed database column length', () => {
    expect(() =>
      CoffeeBean.create({
        code: 'C'.repeat(192),
        name: 'Valid Name',
        regionId: relationshipIds.regionId,
        speciesId: relationshipIds.speciesId,
        processingMethodId: relationshipIds.processingMethodId,
      }),
    ).toThrow('CoffeeBean code must contain between 1 and 191 characters');
  });
});
