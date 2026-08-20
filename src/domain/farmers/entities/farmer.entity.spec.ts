import { describe, expect, it } from 'vitest';

import { Farmer } from './farmer.entity.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const REGION_ID = 'region_01';
const ORGANIZATION_ID = 'organization_01';

describe('Farmer entity', () => {
  it('creates a farmer with a UUID and default state', () => {
    const farmer = Farmer.create({
      code: 'FAR-001',
      name: 'Arunika Farmer',
      type: 'smallholder',
      regionId: REGION_ID,
      organizationId: ORGANIZATION_ID,
    });

    expect(farmer.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(farmer.code).toBe('FAR-001');
    expect(farmer.regionId).toBe(REGION_ID);
    expect(farmer.organizationId).toBe(ORGANIZATION_ID);
    expect(farmer.isActive).toBe(true);
    expect(farmer.sortOrder).toBe(0);
  });

  it('preserves a valid reconstituted farmer and timestamps', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    const farmer = Farmer.reconstitute({
      uuid: UUID,
      code: 'FAR-001',
      name: 'Arunika Farmer',
      type: 'smallholder',
      regionId: REGION_ID,
      organizationId: ORGANIZATION_ID,
      contactName: 'Fakhri',
      phone: '+628123456789',
      email: 'farmer@example.com',
      farmingSinceYear: 2010,
      description: 'Coffee farmer',
      story: 'Coffee farming story',
      isActive: true,
      sortOrder: 1,
      createdAt,
      updatedAt,
    });

    expect(farmer.uuid).toBe(UUID);
    expect(farmer.regionId).toBe(REGION_ID);
    expect(farmer.organizationId).toBe(ORGANIZATION_ID);
    expect(farmer.farmingSinceYear).toBe(2010);
    expect(farmer.createdAt).toEqual(createdAt);
    expect(farmer.updatedAt).toEqual(updatedAt);
  });

  it('preserves optional farmer fields as null by default', () => {
    const farmer = Farmer.create({
      code: 'FAR-001',
      name: 'Arunika Farmer',
      type: 'smallholder',
      regionId: REGION_ID,
    });

    expect(farmer.organizationId).toBeNull();
    expect(farmer.contactName).toBeNull();
    expect(farmer.phone).toBeNull();
    expect(farmer.email).toBeNull();
    expect(farmer.farmingSinceYear).toBeNull();
    expect(farmer.description).toBeNull();
    expect(farmer.story).toBeNull();
  });

  it('rejects invalid UUIDs and required farmer fields', () => {
    expect(() =>
      Farmer.create({
        uuid: 'invalid',
        code: 'FAR-001',
        name: 'Arunika Farmer',
        type: 'smallholder',
        regionId: REGION_ID,
      }),
    ).toThrow('Farmer uuid must be a valid UUID');

    expect(() =>
      Farmer.create({
        code: '   ',
        name: 'Arunika Farmer',
        type: 'smallholder',
        regionId: REGION_ID,
      }),
    ).toThrow('Farmer code must contain between 1 and 191 characters');
  });

  it('rejects required strings that exceed the database contract length', () => {
    expect(() =>
      Farmer.create({
        code: 'A'.repeat(192),
        name: 'Arunika Farmer',
        type: 'smallholder',
        regionId: REGION_ID,
      }),
    ).toThrow('Farmer code must contain between 1 and 191 characters');
  });
});
