import type { Prisma } from '../generated/prisma/client.js';

export async function seedRegion(tx: Prisma.TransactionClient, countryId: string) {
  return tx.region.upsert({
    where: { code: 'ID-WJ-BDG' },
    update: { countryId, name: 'West Java Coffee Region', isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000002',
      countryId,
      code: 'ID-WJ-BDG',
      name: 'West Java Coffee Region',
      type: 'coffee-origin',
      province: 'West Java',
      city: 'Bandung',
      altitudeUnit: 'MASL',
      isActive: true,
      sortOrder: 1,
    },
  });
}
