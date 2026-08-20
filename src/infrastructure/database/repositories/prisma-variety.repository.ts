import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

@Injectable()
export class PrismaVarietyRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() =>
      this.prisma.variety.findUnique({ where: { id } }),
    );
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.variety.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.VarietyFindManyArgs) {
    return this.execute(() => this.prisma.variety.findMany(args));
  }

  count(args?: Prisma.VarietyCountArgs) {
    return this.execute(() => this.prisma.variety.count(args));
  }

  create(data: Prisma.VarietyCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.variety.create({ data }),
    );
  }

  update(
    where: Prisma.VarietyWhereUniqueInput,
    data: Prisma.VarietyUpdateInput,
  ) {
    return this.executeTransaction((transaction) =>
      transaction.variety.update({ where, data }),
    );
  }

  delete(where: Prisma.VarietyWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.variety.delete({ where }),
    );
  }
}
