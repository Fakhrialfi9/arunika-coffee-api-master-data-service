import { randomUUID } from 'node:crypto';

export interface CertificationProps {
  uuid?: string;
  code: string;
  name: string;
  type?: string | null;
  issuer?: string | null;
  website?: string | null;
  countryScope?: string | null;
  requiresExpiration?: boolean;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteCertificationProps extends CertificationProps {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Certification {
  private constructor(
    private readonly _uuid: string,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _type: string | null,
    private readonly _issuer: string | null,
    private readonly _website: string | null,
    private readonly _countryScope: string | null,
    private readonly _requiresExpiration: boolean,
    private readonly _description: string | null,
    private readonly _isActive: boolean,
    private readonly _sortOrder: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(props: CertificationProps): Certification {
    const now = new Date();

    return new Certification(
      props.uuid ?? randomUUID(),
      props.code,
      props.name,
      props.type ?? null,
      props.issuer ?? null,
      props.website ?? null,
      props.countryScope ?? null,
      props.requiresExpiration ?? false,
      props.description ?? null,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ).validate();
  }

  static reconstitute(props: ReconstituteCertificationProps): Certification {
    return new Certification(
      props.uuid,
      props.code,
      props.name,
      props.type ?? null,
      props.issuer ?? null,
      props.website ?? null,
      props.countryScope ?? null,
      props.requiresExpiration ?? false,
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
  get type(): string | null {
    return this._type;
  }
  get issuer(): string | null {
    return this._issuer;
  }
  get website(): string | null {
    return this._website;
  }
  get countryScope(): string | null {
    return this._countryScope;
  }
  get requiresExpiration(): boolean {
    return this._requiresExpiration;
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

  private validate(): Certification {
    Certification.validateUuid(this._uuid);
    Certification.validateRequiredString(this._code, 'code');
    Certification.validateRequiredString(this._name, 'name');
    Certification.validateOptionalString(this._type, 'type');
    Certification.validateOptionalString(this._issuer, 'issuer');
    Certification.validateOptionalString(this._website, 'website');
    Certification.validateOptionalString(this._countryScope, 'countryScope');
    Certification.validateOptionalString(this._description, 'description');

    if (!Number.isInteger(this._sortOrder) || this._sortOrder < 0) {
      throw new Error('Certification sortOrder must be a non-negative integer');
    }

    if (Number.isNaN(this._createdAt.getTime())) {
      throw new Error('Certification createdAt must be a valid date');
    }
    if (Number.isNaN(this._updatedAt.getTime())) {
      throw new Error('Certification updatedAt must be a valid date');
    }

    return this;
  }

  private static validateUuid(uuid: string): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid,
      )
    ) {
      throw new Error('Certification uuid must be a valid UUID');
    }
  }

  private static validateRequiredString(value: string, field: string): void {
    if (value.trim().length === 0 || value.length > 191) {
      throw new Error(
        `Certification ${field} must contain between 1 and 191 characters`,
      );
    }
  }

  private static validateOptionalString(
    value: string | null,
    field: string,
  ): void {
    if (value !== null && value.length > 191) {
      throw new Error(`Certification ${field} must not exceed 191 characters`);
    }
  }
}
