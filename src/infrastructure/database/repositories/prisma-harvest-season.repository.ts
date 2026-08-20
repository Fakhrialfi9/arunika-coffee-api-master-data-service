import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../prisma/generated/prisma/client.js';

import {
  RepositoryBusinessRuleError,
  RepositoryNotFoundError,
} from '../errors/repository.error.js';
import { PrismaBaseRepository } from './prisma-base.repository.js';

@Injectable()
export class PrismaHarvestSeasonRepository extends PrismaBaseRepository {
  findById(id: string) {
    return this.execute(() =>
      this.prisma.harvestSeason.findUnique({ where: { id } }),
    );
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
    return this.executeTransaction(async (transaction) => {
      await this.assertCurrentSeasonInvariant(transaction, {
        isCurrent: data.isCurrent === true,
        isActive: data.isActive !== false,
      });

      return transaction.harvestSeason.create({ data });
    });
  }

  update(
    where: Prisma.HarvestSeasonWhereUniqueInput,
    data: Prisma.HarvestSeasonUpdateInput,
  ) {
    return this.executeTransaction(async (transaction) => {
      const existing = await transaction.harvestSeason.findUnique({
        where,
        select: { id: true, isCurrent: true, isActive: true },
      });

      if (!existing) {
        throw new RepositoryNotFoundError();
      }

      const isCurrent = this.resolveBooleanUpdate(
        data.isCurrent,
        existing.isCurrent,
      );
      const isActive = this.resolveBooleanUpdate(
        data.isActive,
        existing.isActive,
      );

      await this.assertCurrentSeasonInvariant(transaction, {
        isCurrent,
        isActive,
        excludeId: existing.id,
      });

      return transaction.harvestSeason.update({ where, data });
    });
  }

  delete(where: Prisma.HarvestSeasonWhereUniqueInput) {
    return this.executeTransaction((transaction) =>
      transaction.harvestSeason.delete({ where }),
    );
  }

  private async assertCurrentSeasonInvariant(
    transaction: Prisma.TransactionClient,
    state: {
      isCurrent: boolean;
      isActive: boolean;
      excludeId?: string;
    },
  ): Promise<void> {
    if (!state.isCurrent) return;

    if (!state.isActive) {
      throw new RepositoryBusinessRuleError(
        'HARVEST_SEASON_CURRENT_MUST_BE_ACTIVE',
        'A current harvest season must be active',
      );
    }

    const existingCurrent = await transaction.harvestSeason.findFirst({
      where: {
        isCurrent: true,
        ...(state.excludeId ? { id: { not: state.excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existingCurrent) {
      throw new RepositoryBusinessRuleError(
        'HARVEST_SEASON_SINGLE_CURRENT',
        'Only one harvest season may be marked as current',
      );
    }
  }

  private resolveBooleanUpdate(
    value: boolean | Prisma.BoolFieldUpdateOperationsInput | undefined,
    current: boolean,
  ): boolean {
    if (value === undefined) return current;
    if (typeof value === 'boolean') return value;
    return typeof value.set === 'boolean' ? value.set : current;
  }
}
