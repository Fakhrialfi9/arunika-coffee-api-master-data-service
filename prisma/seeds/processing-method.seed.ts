import type { Prisma } from '../generated/prisma/client.js';

export async function seedProcessingMethod(tx: Prisma.TransactionClient) {
  return tx.processingMethod.upsert({
    where: { code: 'WASHED' },
    update: { name: 'Washed', isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000008',
      code: 'WASHED',
      name: 'Washed',
      category: 'wet',
      fermentation: true,
      fermentationType: 'controlled',
      dryingMethod: 'raised-bed',
      processingSteps: ['pulping', 'fermentation', 'washing', 'drying'],
      parameters: { targetMoisture: 11 },
      isActive: true,
      sortOrder: 1,
    },
  });
}
