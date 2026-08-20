import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

@Injectable()
export class PrismaCoffeeGradeRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() =>
      this.prisma.coffeeGrade.findUnique({ where: { id } }),
    );
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.coffeeGrade.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.CoffeeGradeFindManyArgs) {
    return this.execute(() => this.prisma.coffeeGrade.findMany(args));
  }

  count(args?: Prisma.CoffeeGradeCountArgs) {
    return this.execute(() => this.prisma.coffeeGrade.count(args));
  }

  create(data: Prisma.CoffeeGradeCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.coffeeGrade.create({ data }),
    );
  }

  update(
    where: Prisma.CoffeeGradeWhereUniqueInput,
    data: Prisma.CoffeeGradeUpdateInput,
  ) {
    return this.executeTransaction((transaction) =>
      transaction.coffeeGrade.update({ where, data }),
    );
  }

  delete(where: Prisma.CoffeeGradeWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.coffeeGrade.delete({ where }),
    );
  }
}
