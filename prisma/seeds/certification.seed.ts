import type { Prisma } from '../generated/prisma/client.js';

export async function seedCertification(tx: Prisma.TransactionClient) {
  return tx.certifications.upsert({
    where: { code: 'ORGANIC' },
    update: { name: 'Organic', isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000012',
      code: 'ORGANIC',
      name: 'Organic',
      type: 'organic',
      issuer: 'Organic Certification Body',
      countryScope: 'ID',
      requiresExpiration: true,
      isActive: true,
      sortOrder: 1,
    },
  });
}
