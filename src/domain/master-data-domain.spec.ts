import { describe, expect, it } from 'vitest';
import { Country } from './country/entities/country.entity.js';
import { Region } from './region/entities/region.entity.js';
import { CoffeeBean } from './coffee-beans/entities/coffee-bean.entity.js';

describe('master data core domain entities', () => {
  it('creates Country with generated UUID and lifecycle defaults', () => { const entity = Country.create({ code: 'ID', name: 'Indonesia', iso2: 'ID', iso3: 'IDN' }); expect(entity.uuid).toMatch(/^[0-9a-f-]{36}$/i); expect(entity.isActive).toBe(true); });
  it('rejects Region without countryId', () => { expect(() => Region.create({ code: 'JBR', name: 'West Java', countryId: '' })).toThrow(); });
  it('requires CoffeeBean core dependencies', () => { expect(() => CoffeeBean.create({ code: '', name: 'Test', regionId: 'r', speciesId: 's', processingMethodId: 'p' })).toThrow(); });
});
