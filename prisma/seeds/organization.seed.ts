import type { Prisma } from '../generated/prisma/client.js';

export async function seedOrganization(tx: Prisma.TransactionClient, regionId: string) {
  return tx.organization.upsert({
    where: { code: 'ORG-ARUNIKA' },
    update: { regionId, name: 'Arunika Coffee Cooperative', isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000003',
      code: 'ORG-ARUNIKA',
      name: 'Arunika Coffee Cooperative',
      type: 'cooperative',
      regionId,
      contactName: 'Master Data Seed',
      establishedYear: 2020,
      memberCount: 1,
      isActive: true,
      sortOrder: 1,
    },
  });
}
