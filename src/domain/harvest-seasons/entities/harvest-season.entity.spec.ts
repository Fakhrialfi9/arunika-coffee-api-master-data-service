import { describe, expect, it } from 'vitest';

import { HarvestSeason } from './harvest-season.entity.js';

describe('HarvestSeason entity', () => {
  it('creates a harvest season with a UUID and database defaults', () => {
    const season = HarvestSeason.create({
      name: '2026 Main Harvest',
      year: 2026,
    });

    expect(season.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(season.year).toBe(2026);
    expect(season.isCurrent).toBe(false);
    expect(season.isActive).toBe(true);
    expect(season.sortOrder).toBe(0);
    expect(season.startMonth).toBeNull();
    expect(season.endMonth).toBeNull();
  });

  it('preserves year, season period, and current-season attributes', () => {
    const season = HarvestSeason.create({
      name: '2026/2027 Main Harvest',
      label: 'Harvest 2026/2027',
      year: 2026,
      seasonType: 'Main',
      startMonth: 10,
      endMonth: 4,
      isCurrent: true,
      description: 'Cross-year harvest season',
      sortOrder: 2,
    });

    expect(season.label).toBe('Harvest 2026/2027');
    expect(season.seasonType).toBe('Main');
    expect(season.startMonth).toBe(10);
    expect(season.endMonth).toBe(4);
    expect(season.isCurrent).toBe(true);
    expect(season.isActive).toBe(true);
    expect(season.description).toBe('Cross-year harvest season');
    expect(season.sortOrder).toBe(2);
  });

  it('rejects invalid year and month semantics', () => {
    expect(() =>
      HarvestSeason.create({
        name: 'Invalid Year',
        year: 0,
      }),
    ).toThrow('year must be an integer between 1 and 9999');

    expect(() =>
      HarvestSeason.create({
        name: 'Invalid Month',
        year: 2026,
        startMonth: 13,
        endMonth: 2,
      }),
    ).toThrow('startMonth must be an integer between 1 and 12');

    expect(() =>
      HarvestSeason.create({
        name: 'Partial Period',
        year: 2026,
        startMonth: 3,
      }),
    ).toThrow('startMonth and endMonth must be provided together');
  });

  it('requires current seasons to remain active', () => {
    expect(() =>
      HarvestSeason.create({
        name: 'Inactive Current Season',
        year: 2026,
        isCurrent: true,
        isActive: false,
      }),
    ).toThrow('current season must be active');
  });

  it('rejects invalid UUIDs, required strings, and sort order', () => {
    expect(() =>
      HarvestSeason.create({
        uuid: 'not-a-uuid',
        name: 'Valid Season',
        year: 2026,
      }),
    ).toThrow('uuid must be a valid UUID');

    expect(() =>
      HarvestSeason.create({
        name: ' '.repeat(1),
        year: 2026,
      }),
    ).toThrow('name must contain between 1 and 191 characters');

    expect(() =>
      HarvestSeason.create({
        name: 'Valid Season',
        year: 2026,
        sortOrder: -1,
      }),
    ).toThrow('sortOrder must be a non-negative integer');
  });
});
