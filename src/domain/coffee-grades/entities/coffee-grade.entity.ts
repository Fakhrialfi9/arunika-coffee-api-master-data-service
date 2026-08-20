import { randomUUID } from 'node:crypto';

export interface CoffeeGradeProps {
  uuid?: string;
  code: string;
  name: string;
  category?: string | null;
  standard?: string | null;
  minimumCuppingScore?: number | null;
  maxDefectCount?: number | null;
  exportEligible?: boolean;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteCoffeeGradeProps extends CoffeeGradeProps {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CoffeeGrade {
  private constructor(
    private readonly _uuid: string,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _category: string | null,
    private readonly _standard: string | null,
    private readonly _minimumCuppingScore: number | null,
    private readonly _maxDefectCount: number | null,
    private readonly _exportEligible: boolean,
    private readonly _description: string | null,
    private readonly _isActive: boolean,
    private readonly _sortOrder: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(props: CoffeeGradeProps): CoffeeGrade {
    const now = new Date();

    return new CoffeeGrade(
      props.uuid ?? randomUUID(),
      props.code,
      props.name,
      props.category ?? null,
      props.standard ?? null,
      props.minimumCuppingScore ?? null,
      props.maxDefectCount ?? null,
      props.exportEligible ?? false,
      props.description ?? null,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ).validate();
  }

  static reconstitute(props: ReconstituteCoffeeGradeProps): CoffeeGrade {
    return new CoffeeGrade(
      props.uuid,
      props.code,
      props.name,
      props.category ?? null,
      props.standard ?? null,
      props.minimumCuppingScore ?? null,
      props.maxDefectCount ?? null,
      props.exportEligible ?? false,
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
  get category(): string | null {
    return this._category;
  }
  get standard(): string | null {
    return this._standard;
  }
  get minimumCuppingScore(): number | null {
    return this._minimumCuppingScore;
  }
  get maxDefectCount(): number | null {
    return this._maxDefectCount;
  }
  get exportEligible(): boolean {
    return this._exportEligible;
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

  private validate(): CoffeeGrade {
    CoffeeGrade.validateUuid(this._uuid);
    CoffeeGrade.validateRequiredString(this._code, 'code');
    CoffeeGrade.validateRequiredString(this._name, 'name');
    CoffeeGrade.validateOptionalString(this._category, 'category');
    CoffeeGrade.validateOptionalString(this._standard, 'standard');
    CoffeeGrade.validateOptionalString(this._description, 'description');

    if (Number.isNaN(this._createdAt.getTime())) {
      throw new Error('CoffeeGrade createdAt must be a valid date');
    }
    if (Number.isNaN(this._updatedAt.getTime())) {
      throw new Error('CoffeeGrade updatedAt must be a valid date');
    }

    return this;
  }

  private static validateUuid(uuid: string): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid,
      )
    ) {
      throw new Error('CoffeeGrade uuid must be a valid UUID');
    }
  }

  private static validateRequiredString(value: string, field: string): void {
    if (value.trim().length === 0 || value.length > 191) {
      throw new Error(
        `CoffeeGrade ${field} must contain between 1 and 191 characters`,
      );
    }
  }

  private static validateOptionalString(
    value: string | null,
    field: string,
  ): void {
    if (value !== null && value.length > 191) {
      throw new Error(`CoffeeGrade ${field} must not exceed 191 characters`);
    }
  }
}
