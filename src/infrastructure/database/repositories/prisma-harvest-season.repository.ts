import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

@Injectable()
export class PrismaHarvestSeasonRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() => this.prisma.harvestSeason.findUnique({ where: { id } }));
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.harvestSeason.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.HarvestSeasonFindManyArgs) {
    return this.execute(() => this.prisma.harvestSeason.findMany(args));
  }

  count(args?: Prisma.HarvestSeasonCountArgs) {
    return this.execute(() => this.prisma.harvestSeason.count(args));
  }

  create(data: Prisma.HarvestSeasonCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.harvestSeason.create({ data }),
    );
  }

  update(
    where: Prisma.HarvestSeasonWhereUniqueInput,
    data: Prisma.HarvestSeasonUpdateInput,
  ) {
    return this.executeTransaction((transaction) =>
      transaction.harvestSeason.update({ where, data }),
    );
  }

  delete(where: Prisma.HarvestSeasonWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.harvestSeason.delete({ where }),
    );
  }
}
