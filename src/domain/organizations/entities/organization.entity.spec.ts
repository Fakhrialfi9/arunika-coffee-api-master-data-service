import { describe, expect, it } from 'vitest';

import { Organization } from './organization.entity.js';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const REGION_ID = 'region_01';

describe('Organization entity', () => {
  it('creates an organization with a UUID and default state', () => {
    const organization = Organization.create({
      code: 'ORG-001',
      name: 'Arunika Coffee Cooperative',
      type: 'cooperative',
      regionId: REGION_ID,
    });

    expect(organization.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(organization.code).toBe('ORG-001');
    expect(organization.regionId).toBe(REGION_ID);
    expect(organization.isActive).toBe(true);
    expect(organization.sortOrder).toBe(0);
  });

  it('preserves a valid reconstituted organization and timestamps', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    const organization = Organization.reconstitute({
      uuid: UUID,
      code: 'ORG-001',
      name: 'Arunika Coffee Cooperative',
      type: 'cooperative',
      regionId: REGION_ID,
      contactName: 'Fakhri',
      phone: '+628123456789',
      email: 'hello@example.com',
      establishedYear: 2010,
      memberCount: 25,
      description: 'Coffee producer organization',
      isActive: true,
      sortOrder: 1,
      createdAt,
      updatedAt,
    });

    expect(organization.uuid).toBe(UUID);
    expect(organization.regionId).toBe(REGION_ID);
    expect(organization.memberCount).toBe(25);
    expect(organization.createdAt).toEqual(createdAt);
    expect(organization.updatedAt).toEqual(updatedAt);
  });

  it('preserves optional organization fields as null by default', () => {
    const organization = Organization.create({
      code: 'ORG-001',
      name: 'Arunika Coffee Cooperative',
      type: 'cooperative',
      regionId: REGION_ID,
    });

    expect(organization.contactName).toBeNull();
    expect(organization.phone).toBeNull();
    expect(organization.email).toBeNull();
    expect(organization.establishedYear).toBeNull();
    expect(organization.memberCount).toBeNull();
    expect(organization.description).toBeNull();
  });

  it('rejects invalid UUIDs and required organization fields', () => {
    expect(() =>
      Organization.create({
        uuid: 'invalid',
        code: 'ORG-001',
        name: 'Arunika Coffee Cooperative',
        type: 'cooperative',
        regionId: REGION_ID,
      }),
    ).toThrow('Organization uuid must be a valid UUID');

    expect(() =>
      Organization.create({
        code: '   ',
        name: 'Arunika Coffee Cooperative',
        type: 'cooperative',
        regionId: REGION_ID,
      }),
    ).toThrow('Organization code must contain between 1 and 191 characters');
  });

  it('rejects required strings that exceed the database contract length', () => {
    expect(() =>
      Organization.create({
        code: 'A'.repeat(192),
        name: 'Arunika Coffee Cooperative',
        type: 'cooperative',
        regionId: REGION_ID,
      }),
    ).toThrow('Organization code must contain between 1 and 191 characters');
  });
});
