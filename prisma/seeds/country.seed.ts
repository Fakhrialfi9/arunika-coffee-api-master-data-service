import type { Prisma } from '../generated/prisma/client.js';

export async function seedCountry(tx: Prisma.TransactionClient) {
  return tx.country.upsert({
    where: { code: 'ID' },
    update: { name: 'Indonesia', iso2: 'ID', iso3: 'IDN', isCoffeeOrigin: true, isActive: true, sortOrder: 1 },
    create: {
      uuid: '00000000-0000-4000-8000-000000000001',
      code: 'ID',
      name: 'Indonesia',
      officialName: 'Republic of Indonesia',
      shortName: 'Indonesia',
      iso2: 'ID',
      iso3: 'IDN',
      continent: 'Asia',
      timezone: 'Asia/Jakarta',
      phoneCode: '+62',
      currency: 'Indonesian Rupiah',
      currencyCode: 'IDR',
      isCoffeeOrigin: true,
      isActive: true,
      sortOrder: 1,
    },
  });
}
