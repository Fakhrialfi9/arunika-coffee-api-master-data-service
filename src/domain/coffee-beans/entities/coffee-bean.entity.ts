import { randomUUID } from 'node:crypto';

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
  flavorProfiles?: unknown | null;
  aromaNotes?: unknown | null;
  availableWeight?: number | null;
  reservedWeight?: number | null;
  weightUnit?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteCoffeeBeanProps extends CoffeeBeanProps {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CoffeeBean {
  private constructor(
    private readonly _uuid: string,
    private readonly _code: string,
    private readonly _lotNumber: string | null,
    private readonly _name: string,
    private readonly _description: string | null,
    private readonly _regionId: string,
    private readonly _farmerId: string | null,
    private readonly _farmId: string | null,
    private readonly _speciesId: string,
    private readonly _varietyId: string | null,
    private readonly _processingMethodId: string,
    private readonly _gradeId: string | null,
    private readonly _harvestSeasonId: string | null,
    private readonly _cuppingScore: number | null,
    private readonly _moisture: number | null,
    private readonly _density: number | null,
    private readonly _beanSize: string | null,
    private readonly _qualityStatus: string | null,
    private readonly _flavorProfiles: unknown | null,
    private readonly _aromaNotes: unknown | null,
    private readonly _availableWeight: number | null,
    private readonly _reservedWeight: number | null,
    private readonly _weightUnit: string,
    private readonly _isFeatured: boolean,
    private readonly _isActive: boolean,
    private readonly _sortOrder: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(props: CoffeeBeanProps): CoffeeBean {
    const now = new Date();

    return new CoffeeBean(
      props.uuid ?? randomUUID(),
      props.code,
      props.lotNumber ?? null,
      props.name,
      props.description ?? null,
      props.regionId,
      props.farmerId ?? null,
      props.farmId ?? null,
      props.speciesId,
      props.varietyId ?? null,
      props.processingMethodId,
      props.gradeId ?? null,
      props.harvestSeasonId ?? null,
      props.cuppingScore ?? null,
      props.moisture ?? null,
      props.density ?? null,
      props.beanSize ?? null,
      props.qualityStatus ?? null,
      props.flavorProfiles ?? null,
      props.aromaNotes ?? null,
      props.availableWeight ?? null,
      props.reservedWeight ?? null,
      props.weightUnit ?? 'kg',
      props.isFeatured ?? false,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ).validate();
  }

  static reconstitute(props: ReconstituteCoffeeBeanProps): CoffeeBean {
    return new CoffeeBean(
      props.uuid,
      props.code,
      props.lotNumber ?? null,
      props.name,
      props.description ?? null,
      props.regionId,
      props.farmerId ?? null,
      props.farmId ?? null,
      props.speciesId,
      props.varietyId ?? null,
      props.processingMethodId,
      props.gradeId ?? null,
      props.harvestSeasonId ?? null,
      props.cuppingScore ?? null,
      props.moisture ?? null,
      props.density ?? null,
      props.beanSize ?? null,
      props.qualityStatus ?? null,
      props.flavorProfiles ?? null,
      props.aromaNotes ?? null,
      props.availableWeight ?? null,
      props.reservedWeight ?? null,
      props.weightUnit ?? 'kg',
      props.isFeatured ?? false,
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
  get lotNumber(): string | null {
    return this._lotNumber;
  }
  get name(): string {
    return this._name;
  }
  get description(): string | null {
    return this._description;
  }
  get regionId(): string {
    return this._regionId;
  }
  get farmerId(): string | null {
    return this._farmerId;
  }
  get farmId(): string | null {
    return this._farmId;
  }
  get speciesId(): string {
    return this._speciesId;
  }
  get varietyId(): string | null {
    return this._varietyId;
  }
  get processingMethodId(): string {
    return this._processingMethodId;
  }
  get gradeId(): string | null {
    return this._gradeId;
  }
  get harvestSeasonId(): string | null {
    return this._harvestSeasonId;
  }
  get cuppingScore(): number | null {
    return this._cuppingScore;
  }
  get moisture(): number | null {
    return this._moisture;
  }
  get density(): number | null {
    return this._density;
  }
  get beanSize(): string | null {
    return this._beanSize;
  }
  get qualityStatus(): string | null {
    return this._qualityStatus;
  }
  get flavorProfiles(): unknown | null {
    return this._flavorProfiles;
  }
  get aromaNotes(): unknown | null {
    return this._aromaNotes;
  }
  get availableWeight(): number | null {
    return this._availableWeight;
  }
  get reservedWeight(): number | null {
    return this._reservedWeight;
  }
  get weightUnit(): string {
    return this._weightUnit;
  }
  get isFeatured(): boolean {
    return this._isFeatured;
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

  private validate(): CoffeeBean {
    CoffeeBean.validateUuid(this._uuid);
    CoffeeBean.validateRequiredString(this._code, 'code');
    CoffeeBean.validateOptionalString(this._lotNumber, 'lotNumber');
    CoffeeBean.validateRequiredString(this._name, 'name');
    CoffeeBean.validateOptionalString(this._description, 'description');
    CoffeeBean.validateRequiredString(this._regionId, 'regionId');
    CoffeeBean.validateOptionalString(this._farmerId, 'farmerId');
    CoffeeBean.validateOptionalString(this._farmId, 'farmId');
    CoffeeBean.validateRequiredString(this._speciesId, 'speciesId');
    CoffeeBean.validateOptionalString(this._varietyId, 'varietyId');
    CoffeeBean.validateRequiredString(
      this._processingMethodId,
      'processingMethodId',
    );
    CoffeeBean.validateOptionalString(this._gradeId, 'gradeId');
    CoffeeBean.validateOptionalString(this._harvestSeasonId, 'harvestSeasonId');
    CoffeeBean.validateOptionalString(this._beanSize, 'beanSize');
    CoffeeBean.validateOptionalString(this._qualityStatus, 'qualityStatus');
    CoffeeBean.validateRequiredString(this._weightUnit, 'weightUnit');

    CoffeeBean.validateOptionalNumber(this._cuppingScore, 'cuppingScore');
    CoffeeBean.validateOptionalNumber(this._moisture, 'moisture');
    CoffeeBean.validateOptionalNumber(this._density, 'density');
    CoffeeBean.validateOptionalNumber(this._availableWeight, 'availableWeight');
    CoffeeBean.validateOptionalNumber(this._reservedWeight, 'reservedWeight');

    if (!Number.isInteger(this._sortOrder) || this._sortOrder < 0) {
      throw new Error('CoffeeBean sortOrder must be a non-negative integer');
    }

    if (Number.isNaN(this._createdAt.getTime())) {
      throw new Error('CoffeeBean createdAt must be a valid date');
    }
    if (Number.isNaN(this._updatedAt.getTime())) {
      throw new Error('CoffeeBean updatedAt must be a valid date');
    }

    return this;
  }

  private static validateUuid(uuid: string): void {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uuid,
      )
    ) {
      throw new Error('CoffeeBean uuid must be a valid UUID');
    }
  }

  private static validateRequiredString(value: string, field: string): void {
    if (value.trim().length === 0 || value.length > 191) {
      throw new Error(
        `CoffeeBean ${field} must contain between 1 and 191 characters`,
      );
    }
  }

  private static validateOptionalString(
    value: string | null,
    field: string,
  ): void {
    if (value !== null && value.length > 191) {
      throw new Error(`CoffeeBean ${field} must not exceed 191 characters`);
    }
  }

  private static validateOptionalNumber(
    value: number | null,
    field: string,
  ): void {
    if (value !== null && !Number.isFinite(value)) {
      throw new Error(`CoffeeBean ${field} must be a finite number`);
    }
  }
}
