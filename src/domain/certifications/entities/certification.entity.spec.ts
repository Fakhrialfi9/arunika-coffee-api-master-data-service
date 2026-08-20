import { describe, expect, it } from 'vitest';

import { Certification } from './certification.entity.js';

describe('Certification entity', () => {
  it('creates a certification with a UUID and database defaults', () => {
    const certification = Certification.create({
      code: 'RAINFOREST',
      name: 'Rainforest Alliance',
    });

    expect(certification.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(certification.requiresExpiration).toBe(false);
    expect(certification.isActive).toBe(true);
    expect(certification.sortOrder).toBe(0);
    expect(certification.type).toBeNull();
    expect(certification.issuer).toBeNull();
    expect(certification.website).toBeNull();
    expect(certification.countryScope).toBeNull();
    expect(certification.description).toBeNull();
  });

  it('preserves certification attributes and expiration semantics', () => {
    const certification = Certification.create({
      code: 'EU-ORGANIC',
      name: 'EU Organic',
      type: 'Organic',
      issuer: 'European Union',
      website: 'https://example.test/certifications/eu-organic',
      countryScope: 'EU',
      requiresExpiration: true,
      description: 'Organic certification for export compliance',
      isActive: true,
      sortOrder: 3,
    });

    expect(certification.code).toBe('EU-ORGANIC');
    expect(certification.name).toBe('EU Organic');
    expect(certification.type).toBe('Organic');
    expect(certification.issuer).toBe('European Union');
    expect(certification.website).toBe(
      'https://example.test/certifications/eu-organic',
    );
    expect(certification.countryScope).toBe('EU');
    expect(certification.requiresExpiration).toBe(true);
    expect(certification.description).toBe(
      'Organic certification for export compliance',
    );
    expect(certification.sortOrder).toBe(3);
  });

  it('supports non-expiring certification semantics', () => {
    const certification = Certification.create({
      code: 'DIRECT-TRADE',
      name: 'Direct Trade',
      requiresExpiration: false,
    });

    expect(certification.requiresExpiration).toBe(false);
  });

  it('rejects invalid UUIDs, required strings, and sort order', () => {
    expect(() =>
      Certification.create({
        uuid: 'not-a-uuid',
        code: 'VALID',
        name: 'Valid Certification',
      }),
    ).toThrow('uuid must be a valid UUID');

    expect(() =>
      Certification.create({
        code: ' ',
        name: 'Valid Certification',
      }),
    ).toThrow('code must contain between 1 and 191 characters');

    expect(() =>
      Certification.create({
        code: 'VALID',
        name: ' ',
      }),
    ).toThrow('name must contain between 1 and 191 characters');

    expect(() =>
      Certification.create({
        code: 'VALID',
        name: 'Valid Certification',
        sortOrder: -1,
      }),
    ).toThrow('sortOrder must be a non-negative integer');
  });

  it('rejects strings that exceed the database column length', () => {
    expect(() =>
      Certification.create({
        code: 'A'.repeat(192),
        name: 'Valid Certification',
      }),
    ).toThrow('code must contain between 1 and 191 characters');

    expect(() =>
      Certification.create({
        code: 'VALID',
        name: 'Valid Certification',
        issuer: 'A'.repeat(192),
      }),
    ).toThrow('issuer must not exceed 191 characters');
  });
});
