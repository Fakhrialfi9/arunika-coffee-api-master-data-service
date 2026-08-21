import type { Prisma } from '../generated/prisma/client.js';

export async function seedFarm(tx: Prisma.TransactionClient, farmerId: string) {
  return tx.farm.upsert({
    where: { uuid: '00000000-0000-4000-8000-000000000005' },
    update: { farmerId, name: 'Seed Farm', isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000005',
      name: 'Seed Farm',
      farmerId,
      area: 2.5,
      areaUnit: 'hectare',
      establishedYear: 2015,
      altitudeMin: 1200,
      altitudeMax: 1400,
      altitudeUnit: 'MASL',
      farmingPractice: 'shade-grown',
      isActive: true,
      sortOrder: 1,
    },
  });
}
