import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

@Injectable()
export class PrismaProcessingMethodRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() =>
      this.prisma.processingMethod.findUnique({ where: { id } }),
    );
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.processingMethod.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.ProcessingMethodFindManyArgs) {
    return this.execute(() => this.prisma.processingMethod.findMany(args));
  }

  count(args?: Prisma.ProcessingMethodCountArgs) {
    return this.execute(() => this.prisma.processingMethod.count(args));
  }

  create(data: Prisma.ProcessingMethodCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.processingMethod.create({ data }),
    );
  }

  update(
    where: Prisma.ProcessingMethodWhereUniqueInput,
    data: Prisma.ProcessingMethodUpdateInput,
  ) {
    return this.executeTransaction((transaction) =>
      transaction.processingMethod.update({ where, data }),
    );
  }

  delete(where: Prisma.ProcessingMethodWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.processingMethod.delete({ where }),
    );
  }
}
