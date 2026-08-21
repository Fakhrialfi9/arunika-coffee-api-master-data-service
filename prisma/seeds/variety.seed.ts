import type { Prisma } from '../generated/prisma/client.js';

export async function seedVariety(tx: Prisma.TransactionClient, speciesId: string) {
  return tx.variety.upsert({
    where: { code: 'ATENG-SUPER' },
    update: { speciesId, name: 'Ateng Super', isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000007',
      speciesId,
      code: 'ATENG-SUPER',
      name: 'Ateng Super',
      originCountry: 'Indonesia',
      plantCharacteristics: { growth: 'compact' },
      flavorCharacteristics: { profile: 'sweet', acidity: 'bright' },
      isActive: true,
      sortOrder: 1,
    },
  });
}
