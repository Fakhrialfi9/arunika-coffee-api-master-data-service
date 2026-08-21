import type { Prisma } from '../generated/prisma/client.js';

export async function seedSensoryProfileFlavor(
  tx: Prisma.TransactionClient,
  sensoryProfileId: string,
  flavorProfileId: string,
) {
  return tx.sensoryProfileFlavor.upsert({
    where: {
      sensoryProfileId_flavorProfileId: { sensoryProfileId, flavorProfileId },
    },
    update: { sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000015',
      sensoryProfileId,
      flavorProfileId,
      sortOrder: 1,
    },
  });
}
