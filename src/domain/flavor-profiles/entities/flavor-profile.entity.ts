import { randomUUID } from 'node:crypto';

export interface FlavorProfileProps {
  uuid?: string;
  code: string;
  name: string;
  category?: string | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteFlavorProfileProps extends FlavorProfileProps {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class FlavorProfile {
  private constructor(
    private readonly _uuid: string,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _category: string | null,
    private readonly _description: string | null,
    private readonly _isActive: boolean,
    private readonly _sortOrder: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(props: FlavorProfileProps): FlavorProfile {
    const now = new Date();

    return new FlavorProfile(
      props.uuid ?? randomUUID(),
      props.code,
      props.name,
      props.category ?? null,
      props.description ?? null,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ).validate();
  }

  static reconstitute(
    props: ReconstituteFlavorProfileProps,
  ): FlavorProfile {
    return new FlavorProfile(
      props.uuid,
      props.code,
      props.name,
      props.category ?? null,
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

  private validate(): FlavorProfile {
    FlavorProfile.validateUuid(this._uuid);
    FlavorProfile.validateRequiredString(this._code, 'code');
    FlavorProfile.validateRequiredString(this._name, 'name');
    FlavorProfile.validateOptionalString(this._category, 'category');
    FlavorProfile.validateOptionalString(this._description, 'description');

    if (!Number.isInteger(this._sortOrder) || this._sortOrder < 0) {
      throw new Error('FlavorProfile sortOrder must be a non-negative integer');
    }

    if (Number.isNaN(this._createdAt.getTime())) {
      throw new Error('FlavorProfile createdAt must be a valid date');
    }
    if (Number.isNaN(this._updatedAt.getTime())) {
      throw new Error('FlavorProfile updatedAt must be a valid date');
    }

    return this;
  }

  private static validateUuid(uuid: string): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid,
      )
    ) {
      throw new Error('FlavorProfile uuid must be a valid UUID');
    }
  }

  private static validateRequiredString(value: string, field: string): void {
    if (value.trim().length === 0 || value.length > 191) {
      throw new Error(
        `FlavorProfile ${field} must contain between 1 and 191 characters`,
      );
    }
  }

  private static validateOptionalString(
    value: string | null,
    field: string,
  ): void {
    if (value !== null && value.length > 191) {
      throw new Error(
        `FlavorProfile ${field} must not exceed 191 characters`,
      );
    }
  }
}
