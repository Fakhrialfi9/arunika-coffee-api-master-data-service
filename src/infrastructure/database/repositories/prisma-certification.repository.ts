import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

@Injectable()
export class PrismaCertificationRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() =>
      this.prisma.certification.findUnique({ where: { id } }),
    );
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.certification.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.CertificationFindManyArgs) {
    return this.execute(() => this.prisma.certification.findMany(args));
  }

  count(args?: Prisma.CertificationCountArgs) {
    return this.execute(() => this.prisma.certification.count(args));
  }

  create(data: Prisma.CertificationCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.certification.create({ data }),
    );
  }

  update(
    where: Prisma.CertificationWhereUniqueInput,
    data: Prisma.CertificationUpdateInput,
  ) {
    return this.executeTransaction((transaction) =>
      transaction.certification.update({ where, data }),
    );
  }

  delete(where: Prisma.CertificationWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.certification.delete({ where }),
    );
  }
}
