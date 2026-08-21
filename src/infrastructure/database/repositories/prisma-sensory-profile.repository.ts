import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import { PrismaBaseRepository } from './prisma-base.repository.js';

@Injectable()
export class PrismaSensoryProfileRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() => this.prisma.sensoryProfile.findUnique({ where: { id } }));
  }

  findByUuid(uuid: string) {
    return this.execute(() => this.prisma.sensoryProfile.findUnique({ where: { uuid } }));
  }

  findByCoffeeBeanId(coffeeBeanId: string) {
    return this.execute(() => this.prisma.sensoryProfile.findUnique({ where: { coffeeBeanId } }));
  }

  findMany(args?: Prisma.SensoryProfileFindManyArgs) {
    return this.execute(() => this.prisma.sensoryProfile.findMany(args));
  }

  count(args?: Prisma.SensoryProfileCountArgs) {
    return this.execute(() => this.prisma.sensoryProfile.count(args));
  }

  create(data: Prisma.SensoryProfileCreateInput) {
    return this.executeTransaction((transaction) => transaction.sensoryProfile.create({ data }));
  }

  update(where: Prisma.SensoryProfileWhereUniqueInput, data: Prisma.SensoryProfileUpdateInput) {
    return this.executeTransaction((transaction) => transaction.sensoryProfile.update({ where, data }));
  }

  delete(where: Prisma.SensoryProfileWhereUniqueInput) {
    return this.executeTransaction((transaction) => transaction.sensoryProfile.delete({ where }));
  }
}
