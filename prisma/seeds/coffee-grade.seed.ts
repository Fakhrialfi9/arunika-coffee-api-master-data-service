import type { Prisma } from '../generated/prisma/client.js';

export async function seedCoffeeGrade(tx: Prisma.TransactionClient) {
  return tx.coffeeGrade.upsert({
    where: { code: 'SPECIALTY-80' },
    update: { name: 'Specialty 80+', exportEligible: true, isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000009',
      code: 'SPECIALTY-80',
      name: 'Specialty 80+',
      category: 'specialty',
      standard: 'SCA',
      minimumCuppingScore: 80,
      maxDefectCount: 5,
      exportEligible: true,
      isActive: true,
      sortOrder: 1,
    },
  });
}
