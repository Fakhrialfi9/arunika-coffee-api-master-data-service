import { randomUUID } from 'node:crypto';

export interface FarmProps {
  uuid?: string;
  name: string;
  farmerId: string;
  area?: number | null;
  areaUnit?: string | null;
  establishedYear?: number | null;
  altitudeMin?: number | null;
  altitudeMax?: number | null;
  altitudeUnit?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  soilType?: string | null;
  climate?: string | null;
  farmingPractice?: string | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteFarmProps extends FarmProps {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Farm {
  private constructor(
    private readonly _uuid: string,
    private readonly _name: string,
    private readonly _farmerId: string,
    private readonly _area: number | null,
    private readonly _areaUnit: string | null,
    private readonly _establishedYear: number | null,
    private readonly _altitudeMin: number | null,
    private readonly _altitudeMax: number | null,
    private readonly _altitudeUnit: string | null,
    private readonly _latitude: number | null,
    private readonly _longitude: number | null,
    private readonly _soilType: string | null,
    private readonly _climate: string | null,
    private readonly _farmingPractice: string | null,
    private readonly _description: string | null,
    private readonly _isActive: boolean,
    private readonly _sortOrder: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(props: FarmProps): Farm {
    const now = new Date();

    return new Farm(
      props.uuid ?? randomUUID(),
      props.name,
      props.farmerId,
      props.area ?? null,
      props.areaUnit ?? 'hectare',
      props.establishedYear ?? null,
      props.altitudeMin ?? null,
      props.altitudeMax ?? null,
      props.altitudeUnit ?? 'MASL',
      props.latitude ?? null,
      props.longitude ?? null,
      props.soilType ?? null,
      props.climate ?? null,
      props.farmingPractice ?? null,
      props.description ?? null,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ).validate();
  }

  static reconstitute(props: ReconstituteFarmProps): Farm {
    return new Farm(
      props.uuid,
      props.name,
      props.farmerId,
      props.area ?? null,
      props.areaUnit ?? 'hectare',
      props.establishedYear ?? null,
      props.altitudeMin ?? null,
      props.altitudeMax ?? null,
      props.altitudeUnit ?? 'MASL',
      props.latitude ?? null,
      props.longitude ?? null,
      props.soilType ?? null,
      props.climate ?? null,
      props.farmingPractice ?? null,
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

  get name(): string {
    return this._name;
  }

  get farmerId(): string {
    return this._farmerId;
  }

  get area(): number | null {
    return this._area;
  }

  get areaUnit(): string | null {
    return this._areaUnit;
  }

  get establishedYear(): number | null {
    return this._establishedYear;
  }

  get altitudeMin(): number | null {
    return this._altitudeMin;
  }

  get altitudeMax(): number | null {
    return this._altitudeMax;
  }

  get altitudeUnit(): string | null {
    return this._altitudeUnit;
  }

  get latitude(): number | null {
    return this._latitude;
  }

  get longitude(): number | null {
    return this._longitude;
  }

  get soilType(): string | null {
    return this._soilType;
  }

  get climate(): string | null {
    return this._climate;
  }

  get farmingPractice(): string | null {
    return this._farmingPractice;
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

  private validate(): Farm {
    Farm.validateUuid(this._uuid);
    Farm.validateRequiredString(this._name, 'name');
    Farm.validateRequiredString(this._farmerId, 'farmerId');
    Farm.validateOptionalString(this._areaUnit, 'areaUnit');
    Farm.validateOptionalString(this._altitudeUnit, 'altitudeUnit');
    Farm.validateOptionalString(this._soilType, 'soilType');
    Farm.validateOptionalString(this._climate, 'climate');
    Farm.validateOptionalString(this._farmingPractice, 'farmingPractice');
    Farm.validateOptionalString(this._description, 'description');

    if (Number.isNaN(this._createdAt.getTime())) {
      throw new Error('Farm createdAt must be a valid date');
    }

    if (Number.isNaN(this._updatedAt.getTime())) {
      throw new Error('Farm updatedAt must be a valid date');
    }

    return this;
  }

  private static validateUuid(uuid: string): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid,
      )
    ) {
      throw new Error('Farm uuid must be a valid UUID');
    }
  }

  private static validateRequiredString(value: string, field: string): void {
    if (value.trim().length === 0 || value.length > 191) {
      throw new Error(
        `Farm ${field} must contain between 1 and 191 characters`,
      );
    }
  }

  private static validateOptionalString(
    value: string | null,
    field: string,
  ): void {
    if (value !== null && value.length > 191) {
      throw new Error(`Farm ${field} must not exceed 191 characters`);
    }
  }
}
