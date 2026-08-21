import { randomUUID } from 'node:crypto';

type JsonPrimitive = string | number | boolean | null;
interface JsonObject {
  [key: string]: JsonValue;
}
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface CoffeeBeanProps {
  uuid?: string;
  code: string;
  lotNumber?: string | null;
  name: string;
  description?: string | null;
  regionId: string;
  farmerId?: string | null;
  farmId?: string | null;
  speciesId: string;
  varietyId?: string | null;
  processingMethodId: string;
  gradeId?: string | null;
  harvestSeasonId?: string | null;
  cuppingScore?: number | null;
  moisture?: number | null;
  density?: number | null;
  beanSize?: string | null;
  qualityStatus?: string | null;
  flavorProfiles?: JsonValue;
  aromaNotes?: JsonValue;
  availableWeight?: number | null;
  reservedWeight?: number | null;
  weightUnit?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReconstituteCoffeeBeanProps = CoffeeBeanProps & {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
};

export class CoffeeBean {
  private constructor(private readonly props: ReconstituteCoffeeBeanProps) {}

  static create(props: CoffeeBeanProps): CoffeeBean {
    const now = new Date();
    return new CoffeeBean({
      ...props,
      uuid: props.uuid ?? randomUUID(),
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
      weightUnit: props.weightUnit ?? 'kg',
      isFeatured: props.isFeatured ?? false,
      isActive: props.isActive ?? true,
      sortOrder: props.sortOrder ?? 0,
    }).validate();
  }

  static reconstitute(props: ReconstituteCoffeeBeanProps): CoffeeBean {
    return new CoffeeBean(props).validate();
  }

  get uuid(): string {
    return this.props.uuid;
  }

  get code(): string {
    return this.props.code;
  }

  get regionId(): string {
    return this.props.regionId;
  }

  get speciesId(): string {
    return this.props.speciesId;
  }

  get processingMethodId(): string {
    return this.props.processingMethodId;
  }

  get varietyId(): string | null {
    return this.props.varietyId ?? null;
  }

  get farmerId(): string | null {
    return this.props.farmerId ?? null;
  }

  get farmId(): string | null {
    return this.props.farmId ?? null;
  }

  toPrimitives(): ReconstituteCoffeeBeanProps {
    return {
      ...this.props,
      createdAt: new Date(this.props.createdAt),
      updatedAt: new Date(this.props.updatedAt),
    };
  }

  private validate(): CoffeeBean {
    for (const [field, value] of [
      ['code', this.props.code],
      ['name', this.props.name],
      ['regionId', this.props.regionId],
      ['speciesId', this.props.speciesId],
      ['processingMethodId', this.props.processingMethodId],
    ] as const)
      if (!value || value.trim().length === 0)
        throw new Error(`CoffeeBean ${field} is required`);
    if (
      !Number.isInteger(this.props.sortOrder) ||
      (this.props.sortOrder ?? 0) < 0
    )
      throw new Error('CoffeeBean sortOrder must be a non-negative integer');
    return this;
  }
}
