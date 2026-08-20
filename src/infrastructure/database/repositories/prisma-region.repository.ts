import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

export class PrismaRegionRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() => this.prisma.region.findUnique({ where: { id } }));
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.region.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.RegionFindManyArgs) {
    return this.execute(() => this.prisma.region.findMany(args));
  }

  count(args?: Prisma.RegionCountArgs) {
    return this.execute(() => this.prisma.region.count(args));
  }

  create(data: Prisma.RegionCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.region.create({ data }),
    );
  }

  update(where: Prisma.RegionWhereUniqueInput, data: Prisma.RegionUpdateInput) {
    return this.executeTransaction((transaction) =>
      transaction.region.update({ where, data }),
    );
  }

  delete(where: Prisma.RegionWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.region.delete({ where }),
    );
  }
}
