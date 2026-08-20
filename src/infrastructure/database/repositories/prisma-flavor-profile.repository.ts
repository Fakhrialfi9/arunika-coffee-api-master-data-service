import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

@Injectable()
export class PrismaFlavorProfileRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() =>
      this.prisma.flavorProfiles.findUnique({ where: { id } }),
    );
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.flavorProfiles.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.FlavorProfilesFindManyArgs) {
    return this.execute(() => this.prisma.flavorProfiles.findMany(args));
  }

  count(args?: Prisma.FlavorProfilesCountArgs) {
    return this.execute(() => this.prisma.flavorProfiles.count(args));
  }

  create(data: Prisma.FlavorProfilesCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.flavorProfiles.create({ data }),
    );
  }

  update(
    where: Prisma.FlavorProfilesWhereUniqueInput,
    data: Prisma.FlavorProfilesUpdateInput,
  ) {
    return this.executeTransaction((transaction) =>
      transaction.flavorProfiles.update({ where, data }),
    );
  }

  delete(where: Prisma.FlavorProfilesWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.flavorProfiles.delete({ where }),
    );
  }
}
