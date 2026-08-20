import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

export class PrismaSpeciesRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() => this.prisma.species.findUnique({ where: { id } }));
  }

  findByUuid(uuid: string) {
    return this.execute(() => this.prisma.species.findUnique({ where: { uuid } }));
  }

  findMany(args?: Prisma.SpeciesFindManyArgs) {
    return this.execute(() => this.prisma.species.findMany(args));
  }

  count(args?: Prisma.SpeciesCountArgs) {
    return this.execute(() => this.prisma.species.count(args));
  }

  create(data: Prisma.SpeciesCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.species.create({ data }),
    );
  }

  update(where: Prisma.SpeciesWhereUniqueInput, data: Prisma.SpeciesUpdateInput) {
    return this.executeTransaction((transaction) =>
      transaction.species.update({ where, data }),
    );
  }

  delete(where: Prisma.SpeciesWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.species.delete({ where }),
    );
  }
}
