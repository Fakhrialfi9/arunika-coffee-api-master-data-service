import type { Prisma } from '../generated/prisma/client.js';

export async function seedHarvestSeason(tx: Prisma.TransactionClient) {
  return tx.harvestSeason.upsert({
    where: { uuid: '00000000-0000-4000-8000-000000000010' },
    update: { name: '2026 Main Harvest', year: 2026, isCurrent: true, isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000010',
      name: '2026 Main Harvest',
      label: '2026 Main Harvest',
      year: 2026,
      seasonType: 'main',
      startMonth: 4,
      endMonth: 9,
      isCurrent: true,
      isActive: true,
      sortOrder: 1,
    },
  });
}
