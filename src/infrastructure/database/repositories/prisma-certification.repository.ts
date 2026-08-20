import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

@Injectable()
export class PrismaCertificationRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() =>
      this.prisma.certifications.findUnique({ where: { id } }),
    );
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.certifications.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.CertificationsFindManyArgs) {
    return this.execute(() => this.prisma.certifications.findMany(args));
  }

  count(args?: Prisma.CertificationsCountArgs) {
    return this.execute(() => this.prisma.certifications.count(args));
  }

  create(data: Prisma.CertificationsCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.certifications.create({ data }),
    );
  }

  update(
    where: Prisma.CertificationsWhereUniqueInput,
    data: Prisma.CertificationsUpdateInput,
  ) {
    return this.executeTransaction((transaction) =>
      transaction.certifications.update({ where, data }),
    );
  }

  delete(where: Prisma.CertificationsWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.certifications.delete({ where }),
    );
  }
}
