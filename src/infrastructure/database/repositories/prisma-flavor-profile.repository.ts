import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

export class PrismaFlavorProfileRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() =>
      this.prisma.flavorProfile.findUnique({ where: { id } }),
    );
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.flavorProfile.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.FlavorProfileFindManyArgs) {
    return this.execute(() => this.prisma.flavorProfile.findMany(args));
  }

  count(args?: Prisma.FlavorProfileCountArgs) {
    return this.execute(() => this.prisma.flavorProfile.count(args));
  }

  create(data: Prisma.FlavorProfileCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.flavorProfile.create({ data }),
    );
  }

  update(
    where: Prisma.FlavorProfileWhereUniqueInput,
    data: Prisma.FlavorProfileUpdateInput,
  ) {
    return this.executeTransaction((transaction) =>
      transaction.flavorProfile.update({ where, data }),
    );
  }

  delete(where: Prisma.FlavorProfileWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.flavorProfile.delete({ where }),
    );
  }
}
