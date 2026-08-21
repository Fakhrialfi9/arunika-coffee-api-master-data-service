import type { Prisma } from '../generated/prisma/client.js';

export async function seedSpecies(tx: Prisma.TransactionClient) {
  return tx.species.upsert({
    where: { code: 'ARABICA' },
    update: { name: 'Arabica', isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000006',
      code: 'ARABICA',
      name: 'Arabica',
      commonName: 'Arabica Coffee',
      scientificName: 'Coffea arabica',
      originRegion: 'Ethiopia',
      isActive: true,
      sortOrder: 1,
    },
  });
}
