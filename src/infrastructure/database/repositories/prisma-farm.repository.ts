import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

export class PrismaFarmRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() => this.prisma.farm.findUnique({ where: { id } }));
  }

  findByUuid(uuid: string) {
    return this.execute(() => this.prisma.farm.findUnique({ where: { uuid } }));
  }

  findMany(args?: Prisma.FarmFindManyArgs) {
    return this.execute(() => this.prisma.farm.findMany(args));
  }

  count(args?: Prisma.FarmCountArgs) {
    return this.execute(() => this.prisma.farm.count(args));
  }

  create(data: Prisma.FarmCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.farm.create({ data }),
    );
  }

  update(where: Prisma.FarmWhereUniqueInput, data: Prisma.FarmUpdateInput) {
    return this.executeTransaction((transaction) =>
      transaction.farm.update({ where, data }),
    );
  }

  delete(where: Prisma.FarmWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.farm.delete({ where }),
    );
  }
}
