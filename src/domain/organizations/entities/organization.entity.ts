import { randomUUID } from 'node:crypto';

export interface OrganizationProps {
  uuid?: string;
  code: string;
  name: string;
  type: string;
  regionId: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  establishedYear?: number | null;
  memberCount?: number | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteOrganizationProps extends OrganizationProps {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Organization {
  private constructor(
    private readonly _uuid: string,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _type: string,
    private readonly _regionId: string,
    private readonly _contactName: string | null,
    private readonly _phone: string | null,
    private readonly _email: string | null,
    private readonly _establishedYear: number | null,
    private readonly _memberCount: number | null,
    private readonly _description: string | null,
    private readonly _isActive: boolean,
    private readonly _sortOrder: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(props: OrganizationProps): Organization {
    const now = new Date();

    return new Organization(
      props.uuid ?? randomUUID(),
      props.code,
      props.name,
      props.type,
      props.regionId,
      props.contactName ?? null,
      props.phone ?? null,
      props.email ?? null,
      props.establishedYear ?? null,
      props.memberCount ?? null,
      props.description ?? null,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ).validate();
  }

  static reconstitute(
    props: ReconstituteOrganizationProps,
  ): Organization {
    return new Organization(
      props.uuid,
      props.code,
      props.name,
      props.type,
      props.regionId,
      props.contactName ?? null,
      props.phone ?? null,
      props.email ?? null,
      props.establishedYear ?? null,
      props.memberCount ?? null,
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

  get type(): string {
    return this._type;
  }

  get regionId(): string {
    return this._regionId;
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

  get establishedYear(): number | null {
    return this._establishedYear;
  }

  get memberCount(): number | null {
    return this._memberCount;
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

  private validate(): Organization {
    Organization.validateUuid(this._uuid);
    Organization.validateRequiredString(this._code, 'code');
    Organization.validateRequiredString(this._name, 'name');
    Organization.validateRequiredString(this._type, 'type');
    Organization.validateRequiredString(this._regionId, 'regionId');
    Organization.validateOptionalString(this._contactName, 'contactName');
    Organization.validateOptionalString(this._phone, 'phone');
    Organization.validateOptionalString(this._email, 'email');
    Organization.validateOptionalString(this._description, 'description');

    if (Number.isNaN(this._createdAt.getTime())) {
      throw new Error('Organization createdAt must be a valid date');
    }

    if (Number.isNaN(this._updatedAt.getTime())) {
      throw new Error('Organization updatedAt must be a valid date');
    }

    return this;
  }

  private static validateUuid(uuid: string): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid,
      )
    ) {
      throw new Error('Organization uuid must be a valid UUID');
    }
  }

  private static validateRequiredString(value: string, field: string): void {
    if (value.trim().length === 0 || value.length > 191) {
      throw new Error(
        `Organization ${field} must contain between 1 and 191 characters`,
      );
    }
  }

  private static validateOptionalString(
    value: string | null,
    field: string,
  ): void {
    if (value !== null && value.length > 191) {
      throw new Error(`Organization ${field} must not exceed 191 characters`);
    }
  }
}
