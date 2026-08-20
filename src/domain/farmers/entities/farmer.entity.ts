import { randomUUID } from 'node:crypto';

export interface FarmerProps {
  uuid?: string;
  code: string;
  name: string;
  type: string;
  regionId: string;
  organizationId?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  farmingSinceYear?: number | null;
  description?: string | null;
  story?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteFarmerProps extends FarmerProps {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Farmer {
  private constructor(
    private readonly _uuid: string,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _type: string,
    private readonly _regionId: string,
    private readonly _organizationId: string | null,
    private readonly _contactName: string | null,
    private readonly _phone: string | null,
    private readonly _email: string | null,
    private readonly _farmingSinceYear: number | null,
    private readonly _description: string | null,
    private readonly _story: string | null,
    private readonly _isActive: boolean,
    private readonly _sortOrder: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(props: FarmerProps): Farmer {
    const now = new Date();

    return new Farmer(
      props.uuid ?? randomUUID(),
      props.code,
      props.name,
      props.type,
      props.regionId,
      props.organizationId ?? null,
      props.contactName ?? null,
      props.phone ?? null,
      props.email ?? null,
      props.farmingSinceYear ?? null,
      props.description ?? null,
      props.story ?? null,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ).validate();
  }

  static reconstitute(props: ReconstituteFarmerProps): Farmer {
    return new Farmer(
      props.uuid,
      props.code,
      props.name,
      props.type,
      props.regionId,
      props.organizationId ?? null,
      props.contactName ?? null,
      props.phone ?? null,
      props.email ?? null,
      props.farmingSinceYear ?? null,
      props.description ?? null,
      props.story ?? null,
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

  get type(): string {
    return this._type;
  }

  get regionId(): string {
    return this._regionId;
  }

  get organizationId(): string | null {
    return this._organizationId;
  }

  get contactName(): string | null {
    return this._contactName;
  }

  get phone(): string | null {
    return this._phone;
  }

  get email(): string | null {
    return this._email;
  }

  get farmingSinceYear(): number | null {
    return this._farmingSinceYear;
  }

  get description(): string | null {
    return this._description;
  }

  get story(): string | null {
    return this._story;
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

  private validate(): Farmer {
    Farmer.validateUuid(this._uuid);
    Farmer.validateRequiredString(this._code, 'code');
    Farmer.validateRequiredString(this._name, 'name');
    Farmer.validateRequiredString(this._type, 'type');
    Farmer.validateRequiredString(this._regionId, 'regionId');
    Farmer.validateOptionalString(this._organizationId, 'organizationId');
    Farmer.validateOptionalString(this._contactName, 'contactName');
    Farmer.validateOptionalString(this._phone, 'phone');
    Farmer.validateOptionalString(this._email, 'email');
    Farmer.validateOptionalString(this._description, 'description');
    Farmer.validateOptionalString(this._story, 'story');

    if (Number.isNaN(this._createdAt.getTime())) {
      throw new Error('Farmer createdAt must be a valid date');
    }

    if (Number.isNaN(this._updatedAt.getTime())) {
      throw new Error('Farmer updatedAt must be a valid date');
    }

    return this;
  }

  private static validateUuid(uuid: string): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid,
      )
    ) {
      throw new Error('Farmer uuid must be a valid UUID');
    }
  }

  private static validateRequiredString(value: string, field: string): void {
    if (value.trim().length === 0 || value.length > 191) {
      throw new Error(
        `Farmer ${field} must contain between 1 and 191 characters`,
      );
    }
  }

  private static validateOptionalString(
    value: string | null,
    field: string,
  ): void {
    if (value !== null && value.length > 191) {
      throw new Error(`Farmer ${field} must not exceed 191 characters`);
    }
  }
}
