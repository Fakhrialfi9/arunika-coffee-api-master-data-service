import type { Prisma } from '../generated/prisma/client.js';

export async function seedFlavorProfile(tx: Prisma.TransactionClient) {
  return tx.flavorProfiles.upsert({
    where: { code: 'CHOCOLATE' },
    update: { name: 'Chocolate', isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000011',
      code: 'CHOCOLATE',
      name: 'Chocolate',
      category: 'sweet',
      description: 'Chocolate and cocoa-like flavor note.',
      isActive: true,
      sortOrder: 1,
    },
  });
}
