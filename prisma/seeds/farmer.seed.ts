import type { Prisma } from '../generated/prisma/client.js';

export async function seedFarmer(tx: Prisma.TransactionClient, regionId: string, organizationId: string) {
  return tx.farmer.upsert({
    where: { code: 'FARMER-SEED-001' },
    update: { regionId, organizationId, name: 'Seed Farmer', isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000004',
      code: 'FARMER-SEED-001',
      name: 'Seed Farmer',
      type: 'smallholder',
      regionId,
      organizationId,
      farmingSinceYear: 2015,
      isActive: true,
      sortOrder: 1,
    },
  });
}
