import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

@Injectable()
export class PrismaFarmerRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() => this.prisma.farmer.findUnique({ where: { id } }));
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.farmer.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.FarmerFindManyArgs) {
    return this.execute(() => this.prisma.farmer.findMany(args));
  }

  count(args?: Prisma.FarmerCountArgs) {
    return this.execute(() => this.prisma.farmer.count(args));
  }

  create(data: Prisma.FarmerCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.farmer.create({ data }),
    );
  }

  update(where: Prisma.FarmerWhereUniqueInput, data: Prisma.FarmerUpdateInput) {
    return this.executeTransaction((transaction) =>
      transaction.farmer.update({ where, data }),
    );
  }

  delete(where: Prisma.FarmerWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.farmer.delete({ where }),
    );
  }
}
