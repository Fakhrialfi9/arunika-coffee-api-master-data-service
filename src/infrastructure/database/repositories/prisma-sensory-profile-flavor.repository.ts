import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';
import { PrismaBaseRepository } from './prisma-base.repository.js';

@Injectable()
export class PrismaSensoryProfileFlavorRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() =>
      this.prisma.sensoryProfileFlavor.findUnique({ where: { id } }),
    );
  }

  findByUuid(uuid: string) {
    return this.execute(() =>
      this.prisma.sensoryProfileFlavor.findUnique({ where: { uuid } }),
    );
  }

  findMany(args?: Prisma.SensoryProfileFlavorFindManyArgs) {
    return this.execute(() => this.prisma.sensoryProfileFlavor.findMany(args));
  }

  count(args?: Prisma.SensoryProfileFlavorCountArgs) {
    return this.execute(() => this.prisma.sensoryProfileFlavor.count(args));
  }

  create(data: Prisma.SensoryProfileFlavorCreateInput) {
    return this.executeTransaction((transaction) =>
      transaction.sensoryProfileFlavor.create({ data }),
    );
  }

  update(
    where: Prisma.SensoryProfileFlavorWhereUniqueInput,
    data: Prisma.SensoryProfileFlavorUpdateInput,
  ) {
    return this.executeTransaction((transaction) =>
      transaction.sensoryProfileFlavor.update({ where, data }),
    );
  }

  delete(where: Prisma.SensoryProfileFlavorWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.sensoryProfileFlavor.delete({ where }),
    );
  }

  async replaceForProfile(
    sensoryProfileId: string,
    mappings: Array<{ flavorProfileId: string; sortOrder?: number }>,
  ) {
    return this.executeTransaction(async (transaction) => {
      await transaction.sensoryProfileFlavor.deleteMany({
        where: { sensoryProfileId },
      });
      return Promise.all(
        mappings.map((mapping, index) =>
          transaction.sensoryProfileFlavor.create({
            data: {
              sensoryProfile: { connect: { id: sensoryProfileId } },
              flavorProfile: { connect: { id: mapping.flavorProfileId } },
              sortOrder: mapping.sortOrder ?? index,
            },
          }),
        ),
      );
    });
  }

  removeMapping(sensoryProfileId: string, flavorProfileId: string) {
    return this.executeTransaction((transaction) =>
      transaction.sensoryProfileFlavor.delete({
        where: {
          sensoryProfileId_flavorProfileId: {
            sensoryProfileId,
            flavorProfileId,
          },
        },
      }),
    );
  }
}
