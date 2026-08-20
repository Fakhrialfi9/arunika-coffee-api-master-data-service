import { randomUUID } from 'node:crypto';

export interface SpeciesProps {
  uuid?: string;
  code: string;
  name: string;
  commonName?: string | null;
  scientificName?: string | null;
  originRegion?: string | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteSpeciesProps extends SpeciesProps {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Species {
  private constructor(
    private readonly _uuid: string,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _commonName: string | null,
    private readonly _scientificName: string | null,
    private readonly _originRegion: string | null,
    private readonly _description: string | null,
    private readonly _isActive: boolean,
    private readonly _sortOrder: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(props: SpeciesProps): Species {
    const now = new Date();

    return new Species(
      props.uuid ?? randomUUID(),
      props.code,
      props.name,
      props.commonName ?? null,
      props.scientificName ?? null,
      props.originRegion ?? null,
      props.description ?? null,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ).validate();
  }

  static reconstitute(props: ReconstituteSpeciesProps): Species {
    return new Species(
      props.uuid,
      props.code,
      props.name,
      props.commonName ?? null,
      props.scientificName ?? null,
      props.originRegion ?? null,
      props.description ?? null,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt,
      props.updatedAt,
    ).validate();
  }

  get uuid(): string {
    return this._uuid;
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get commonName(): string | null {
    return this._commonName;
  }

  get scientificName(): string | null {
    return this._scientificName;
  }

  get originRegion(): string | null {
    return this._originRegion;
  }

  get description(): string | null {
    return this._description;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get sortOrder(): number {
    return this._sortOrder;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt.getTime());
  }

  private validate(): Species {
    Species.validateUuid(this._uuid);
    Species.validateRequiredString(this._code, 'code');
    Species.validateRequiredString(this._name, 'name');
    Species.validateOptionalString(this._commonName, 'commonName');
    Species.validateOptionalString(this._scientificName, 'scientificName');
    Species.validateOptionalString(this._originRegion, 'originRegion');
    Species.validateOptionalString(this._description, 'description');

    if (Number.isNaN(this._createdAt.getTime())) {
      throw new Error('Species createdAt must be a valid date');
    }

    if (Number.isNaN(this._updatedAt.getTime())) {
      throw new Error('Species updatedAt must be a valid date');
    }

    return this;
  }

  private static validateUuid(uuid: string): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid,
      )
    ) {
      throw new Error('Species uuid must be a valid UUID');
    }
  }

  private static validateRequiredString(value: string, field: string): void {
    if (value.trim().length === 0 || value.length > 191) {
      throw new Error(
        `Species ${field} must contain between 1 and 191 characters`,
      );
    }
  }

  private static validateOptionalString(
    value: string | null,
    field: string,
  ): void {
    if (value !== null && value.length > 191) {
      throw new Error(`Species ${field} must not exceed 191 characters`);
    }
  }
}
