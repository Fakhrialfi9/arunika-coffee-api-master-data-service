import { randomUUID } from 'node:crypto';

export interface HarvestSeasonProps {
  uuid?: string;
  name: string;
  label?: string | null;
  year: number;
  seasonType?: string | null;
  startMonth?: number | null;
  endMonth?: number | null;
  isCurrent?: boolean;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteHarvestSeasonProps extends HarvestSeasonProps {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class HarvestSeason {
  private constructor(
    private readonly _uuid: string,
    private readonly _name: string,
    private readonly _label: string | null,
    private readonly _year: number,
    private readonly _seasonType: string | null,
    private readonly _startMonth: number | null,
    private readonly _endMonth: number | null,
    private readonly _isCurrent: boolean,
    private readonly _description: string | null,
    private readonly _isActive: boolean,
    private readonly _sortOrder: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(props: HarvestSeasonProps): HarvestSeason {
    const now = new Date();

    return new HarvestSeason(
      props.uuid ?? randomUUID(),
      props.name,
      props.label ?? null,
      props.year,
      props.seasonType ?? null,
      props.startMonth ?? null,
      props.endMonth ?? null,
      props.isCurrent ?? false,
      props.description ?? null,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ).validate();
  }

  static reconstitute(props: ReconstituteHarvestSeasonProps): HarvestSeason {
    return new HarvestSeason(
      props.uuid,
      props.name,
      props.label ?? null,
      props.year,
      props.seasonType ?? null,
      props.startMonth ?? null,
      props.endMonth ?? null,
      props.isCurrent ?? false,
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
  get label(): string | null {
    return this._label;
  }
  get year(): number {
    return this._year;
  }
  get seasonType(): string | null {
    return this._seasonType;
  }
  get startMonth(): number | null {
    return this._startMonth;
  }
  get endMonth(): number | null {
    return this._endMonth;
  }
  get isCurrent(): boolean {
    return this._isCurrent;
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

  private validate(): HarvestSeason {
    HarvestSeason.validateUuid(this._uuid);
    HarvestSeason.validateRequiredString(this._name, 'name');
    HarvestSeason.validateOptionalString(this._label, 'label');
    HarvestSeason.validateOptionalString(this._seasonType, 'seasonType');
    HarvestSeason.validateOptionalString(this._description, 'description');
    HarvestSeason.validateYear(this._year);
    HarvestSeason.validateMonth(this._startMonth, 'startMonth');
    HarvestSeason.validateMonth(this._endMonth, 'endMonth');

    if ((this._startMonth === null) !== (this._endMonth === null)) {
      throw new Error(
        'HarvestSeason startMonth and endMonth must be provided together',
      );
    }

    if (
      this._startMonth !== null &&
      this._endMonth !== null &&
      this._startMonth > this._endMonth
    ) {
      throw new Error(
        'HarvestSeason startMonth must be less than or equal to endMonth',
      );
    }

    if (this._isCurrent && !this._isActive) {
      throw new Error('HarvestSeason current season must be active');
    }

    if (!Number.isInteger(this._sortOrder) || this._sortOrder < 0) {
      throw new Error('HarvestSeason sortOrder must be a non-negative integer');
    }

    if (Number.isNaN(this._createdAt.getTime())) {
      throw new Error('HarvestSeason createdAt must be a valid date');
    }
    if (Number.isNaN(this._updatedAt.getTime())) {
      throw new Error('HarvestSeason updatedAt must be a valid date');
    }

    return this;
  }

  private static validateUuid(uuid: string): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid,
      )
    ) {
      throw new Error('HarvestSeason uuid must be a valid UUID');
    }
  }

  private static validateRequiredString(value: string, field: string): void {
    if (value.trim().length === 0 || value.length > 191) {
      throw new Error(
        `HarvestSeason ${field} must contain between 1 and 191 characters`,
      );
    }
  }

  private static validateOptionalString(
    value: string | null,
    field: string,
  ): void {
    if (value !== null && value.length > 191) {
      throw new Error(`HarvestSeason ${field} must not exceed 191 characters`);
    }
  }

  private static validateYear(year: number): void {
    if (!Number.isInteger(year) || year < 1 || year > 9999) {
      throw new Error(
        'HarvestSeason year must be an integer between 1 and 9999',
      );
    }
  }

  private static validateMonth(month: number | null, field: string): void {
    if (
      month !== null &&
      (!Number.isInteger(month) || month < 1 || month > 12)
    ) {
      throw new Error(
        `HarvestSeason ${field} must be an integer between 1 and 12`,
      );
    }
  }
}
