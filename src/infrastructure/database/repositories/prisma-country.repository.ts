import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

export class PrismaCountryRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() => this.prisma.country.findUnique({ where: { id } }));
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.country.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.CountryFindManyArgs) {
    return this.execute(() => this.prisma.country.findMany(args));
  }

  count(args?: Prisma.CountryCountArgs) {
    return this.execute(() => this.prisma.country.count(args));
  }

  create(data: Prisma.CountryCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.country.create({ data }),
    );
  }

  update(
    where: Prisma.CountryWhereUniqueInput,
    data: Prisma.CountryUpdateInput,
  ) {
    return this.executeTransaction((transaction) =>
      transaction.country.update({ where, data }),
    );
  }

  delete(where: Prisma.CountryWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.country.delete({ where }),
    );
  }
}
