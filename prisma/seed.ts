import { PrismaClient } from './generated/prisma/client.js';
import { seedMasterData } from './seeds/index.js';

const prisma = new PrismaClient();

try {
  await seedMasterData(prisma);
  console.log('Master data seed completed successfully.');
} finally {
  await prisma.$disconnect();
}
