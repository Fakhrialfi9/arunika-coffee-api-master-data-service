import { randomUUID } from 'node:crypto';

export interface VarietyProps {
  uuid?: string;
  speciesId: string;
  code: string;
  name: string;
  geneticBackground?: string | null;
  originCountry?: string | null;
  plantCharacteristics?: unknown;
  flavorCharacteristics?: unknown;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteVarietyProps extends VarietyProps {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Variety {
  private constructor(
    private readonly _uuid: string,
    private readonly _speciesId: string,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _geneticBackground: string | null,
    private readonly _originCountry: string | null,
    private readonly _plantCharacteristics: unknown,
    private readonly _flavorCharacteristics: unknown,
    private readonly _description: string | null,
    private readonly _isActive: boolean,
    private readonly _sortOrder: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(props: VarietyProps): Variety {
    const now = new Date();

    return new Variety(
      props.uuid ?? randomUUID(),
      props.speciesId,
      props.code,
      props.name,
      props.geneticBackground ?? null,
      props.originCountry ?? null,
      props.plantCharacteristics ?? null,
      props.flavorCharacteristics ?? null,
      props.description ?? null,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ).validate();
  }

  static reconstitute(props: ReconstituteVarietyProps): Variety {
    return new Variety(
      props.uuid,
      props.speciesId,
      props.code,
      props.name,
      props.geneticBackground ?? null,
      props.originCountry ?? null,
      props.plantCharacteristics ?? null,
      props.flavorCharacteristics ?? null,
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

  get speciesId(): string {
    return this._speciesId;
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get geneticBackground(): string | null {
    return this._geneticBackground;
  }

  get originCountry(): string | null {
    return this._originCountry;
  }

  get plantCharacteristics(): unknown {
    return this._plantCharacteristics;
  }

  get flavorCharacteristics(): unknown {
    return this._flavorCharacteristics;
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

  private validate(): Variety {
    Variety.validateUuid(this._uuid);
    Variety.validateRequiredString(this._speciesId, 'speciesId');
    Variety.validateRequiredString(this._code, 'code');
    Variety.validateRequiredString(this._name, 'name');
    Variety.validateOptionalString(
      this._geneticBackground,
      'geneticBackground',
    );
    Variety.validateOptionalString(this._originCountry, 'originCountry');
    Variety.validateOptionalString(this._description, 'description');

    if (Number.isNaN(this._createdAt.getTime())) {
      throw new Error('Variety createdAt must be a valid date');
    }

    if (Number.isNaN(this._updatedAt.getTime())) {
      throw new Error('Variety updatedAt must be a valid date');
    }

    return this;
  }

  private static validateUuid(uuid: string): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid,
      )
    ) {
      throw new Error('Variety uuid must be a valid UUID');
    }
  }

  private static validateRequiredString(value: string, field: string): void {
    if (value.trim().length === 0 || value.length > 191) {
      throw new Error(
        `Variety ${field} must contain between 1 and 191 characters`,
      );
    }
  }

  private static validateOptionalString(
    value: string | null,
    field: string,
  ): void {
    if (value !== null && value.length > 191) {
      throw new Error(`Variety ${field} must not exceed 191 characters`);
    }
  }
}
