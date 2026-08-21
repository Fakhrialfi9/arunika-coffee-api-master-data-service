import type { Prisma } from '../generated/prisma/client.js';

export async function seedSensoryProfile(tx: Prisma.TransactionClient, coffeeBeanId: string) {
  return tx.sensoryProfile.upsert({
    where: { coffeeBeanId },
    update: { cuppingScore: 84.5, aroma: 'cocoa', body: 'silky', acidity: 'bright', sweetness: 'caramel', aftertaste: 'clean', isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000014',
      coffeeBeanId,
      cuppingScore: 84.5,
      aroma: 'cocoa',
      body: 'silky',
      acidity: 'bright',
      sweetness: 'caramel',
      aftertaste: 'clean',
      isActive: true,
      sortOrder: 1,
    },
  });
}
