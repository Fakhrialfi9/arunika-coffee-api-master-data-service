import { randomUUID } from 'node:crypto';

export interface ProcessingMethodProps {
  uuid?: string;
  code: string;
  name: string;
  category?: string | null;
  fermentation?: boolean;
  fermentationType?: string | null;
  fermentationDuration?: string | null;
  dryingMethod?: string | null;
  dryingDuration?: string | null;
  processingSteps?: unknown;
  parameters?: unknown;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReconstituteProcessingMethodProps extends ProcessingMethodProps {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProcessingMethod {
  private constructor(
    private readonly _uuid: string,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _category: string | null,
    private readonly _fermentation: boolean,
    private readonly _fermentationType: string | null,
    private readonly _fermentationDuration: string | null,
    private readonly _dryingMethod: string | null,
    private readonly _dryingDuration: string | null,
    private readonly _processingSteps: unknown,
    private readonly _parameters: unknown,
    private readonly _description: string | null,
    private readonly _isActive: boolean,
    private readonly _sortOrder: number,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(props: ProcessingMethodProps): ProcessingMethod {
    const now = new Date();

    return new ProcessingMethod(
      props.uuid ?? randomUUID(),
      props.code,
      props.name,
      props.category ?? null,
      props.fermentation ?? false,
      props.fermentationType ?? null,
      props.fermentationDuration ?? null,
      props.dryingMethod ?? null,
      props.dryingDuration ?? null,
      props.processingSteps ?? null,
      props.parameters ?? null,
      props.description ?? null,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ).validate();
  }

  static reconstitute(
    props: ReconstituteProcessingMethodProps,
  ): ProcessingMethod {
    return new ProcessingMethod(
      props.uuid,
      props.code,
      props.name,
      props.category ?? null,
      props.fermentation ?? false,
      props.fermentationType ?? null,
      props.fermentationDuration ?? null,
      props.dryingMethod ?? null,
      props.dryingDuration ?? null,
      props.processingSteps ?? null,
      props.parameters ?? null,
      props.description ?? null,
      props.isActive ?? true,
      props.sortOrder ?? 0,
      props.createdAt,
      props.updatedAt,
    ).validate();
  }

  get uuid(): string { return this._uuid; }
  get code(): string { return this._code; }
  get name(): string { return this._name; }
  get category(): string | null { return this._category; }
  get fermentation(): boolean { return this._fermentation; }
  get fermentationType(): string | null { return this._fermentationType; }
  get fermentationDuration(): string | null { return this._fermentationDuration; }
  get dryingMethod(): string | null { return this._dryingMethod; }
  get dryingDuration(): string | null { return this._dryingDuration; }
  get processingSteps(): unknown { return this._processingSteps; }
  get parameters(): unknown { return this._parameters; }
  get description(): string | null { return this._description; }
  get isActive(): boolean { return this._isActive; }
  get sortOrder(): number { return this._sortOrder; }
  get createdAt(): Date { return new Date(this._createdAt.getTime()); }
  get updatedAt(): Date { return new Date(this._updatedAt.getTime()); }

  private validate(): ProcessingMethod {
    ProcessingMethod.validateUuid(this._uuid);
    ProcessingMethod.validateRequiredString(this._code, 'code');
    ProcessingMethod.validateRequiredString(this._name, 'name');
    ProcessingMethod.validateOptionalString(this._category, 'category');
    ProcessingMethod.validateOptionalString(this._fermentationType, 'fermentationType');
    ProcessingMethod.validateOptionalString(this._fermentationDuration, 'fermentationDuration');
    ProcessingMethod.validateOptionalString(this._dryingMethod, 'dryingMethod');
    ProcessingMethod.validateOptionalString(this._dryingDuration, 'dryingDuration');
    ProcessingMethod.validateOptionalString(this._description, 'description');

    if (Number.isNaN(this._createdAt.getTime())) {
      throw new Error('ProcessingMethod createdAt must be a valid date');
    }
    if (Number.isNaN(this._updatedAt.getTime())) {
      throw new Error('ProcessingMethod updatedAt must be a valid date');
    }

    return this;
  }

  private static validateUuid(uuid: string): void {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
      throw new Error('ProcessingMethod uuid must be a valid UUID');
    }
  }

  private static validateRequiredString(value: string, field: string): void {
    if (value.trim().length === 0 || value.length > 191) {
      throw new Error(`ProcessingMethod ${field} must contain between 1 and 191 characters`);
    }
  }

  private static validateOptionalString(value: string | null, field: string): void {
    if (value !== null && value.length > 191) {
      throw new Error(`ProcessingMethod ${field} must not exceed 191 characters`);
    }
  }
}
