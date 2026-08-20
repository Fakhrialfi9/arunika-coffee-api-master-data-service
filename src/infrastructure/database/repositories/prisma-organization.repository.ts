import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

@Injectable()
export class PrismaOrganizationRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() =>
      this.prisma.organization.findUnique({ where: { id } }),
    );
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.organization.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.OrganizationFindManyArgs) {
    return this.execute(() => this.prisma.organization.findMany(args));
  }

  count(args?: Prisma.OrganizationCountArgs) {
    return this.execute(() => this.prisma.organization.count(args));
  }

  create(data: Prisma.OrganizationCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.organization.create({ data }),
    );
  }

  update(
    where: Prisma.OrganizationWhereUniqueInput,
    data: Prisma.OrganizationUpdateInput,
  ) {
    return this.executeTransaction((transaction) =>
      transaction.organization.update({ where, data }),
    );
  }

  delete(where: Prisma.OrganizationWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.organization.delete({ where }),
    );
  }
}
