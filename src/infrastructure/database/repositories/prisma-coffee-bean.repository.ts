import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

export class PrismaCoffeeBeanRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() => this.prisma.coffeeBean.findUnique({ where: { id } }));
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.coffeeBean.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.CoffeeBeanFindManyArgs) {
    return this.execute(() => this.prisma.coffeeBean.findMany(args));
  }

  count(args?: Prisma.CoffeeBeanCountArgs) {
    return this.execute(() => this.prisma.coffeeBean.count(args));
  }

  create(data: Prisma.CoffeeBeanCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.coffeeBean.create({ data }),
    );
  }

  update(
    where: Prisma.CoffeeBeanWhereUniqueInput,
    data: Prisma.CoffeeBeanUpdateInput,
  ) {
    return this.executeTransaction((transaction) =>
      transaction.coffeeBean.update({ where, data }),
    );
  }

  delete(where: Prisma.CoffeeBeanWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.coffeeBean.delete({ where }),
    );
  }
}
