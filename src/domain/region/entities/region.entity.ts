import { randomUUID } from 'node:crypto';

export interface RegionProps {
  uuid?: string;
  countryId: string;
  code: string;
  name: string;
  type?: string | null;
  province?: string | null;
  district?: string | null;
  city?: string | null;
  village?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  altitudeMin?: number | null;
  altitudeMax?: number | null;
  altitudeUnit?: string | null;
  climate?: string | null;
  soilType?: string | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReconstituteRegionProps = RegionProps & {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
};

export class Region {
  private constructor(private readonly props: ReconstituteRegionProps) {}

  static create(props: RegionProps): Region {
    const now = new Date();
    return new Region({
      ...props,
      uuid: props.uuid ?? randomUUID(),
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
      altitudeUnit: props.altitudeUnit === undefined ? 'MASL' : props.altitudeUnit,
      isActive: props.isActive ?? true,
      sortOrder: props.sortOrder ?? 0,
    }).validate();
  }

  static reconstitute(props: ReconstituteRegionProps): Region {
    return new Region(props).validate();
  }

  get uuid(): string {
    return this.props.uuid;
  }

  get countryId(): string {
    return this.props.countryId;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get isActive(): boolean {
    return this.props.isActive ?? true;
  }

  get sortOrder(): number {
    return this.props.sortOrder ?? 0;
  }

  toPrimitives(): ReconstituteRegionProps {
    return {
      ...this.props,
      createdAt: new Date(this.props.createdAt),
      updatedAt: new Date(this.props.updatedAt),
    };
  }

  private validate(): Region {
    if (!this.props.countryId.trim())
      throw new Error('Region countryId is required');
    for (const [field, value] of [
      ['code', this.props.code],
      ['name', this.props.name],
    ] as const)
      if (value.trim().length === 0 || value.length > 191)
        throw new Error(
          `Region ${field} must contain between 1 and 191 characters`,
        );
    if (
      !Number.isInteger(this.props.sortOrder) ||
      (this.props.sortOrder ?? 0) < 0
    )
      throw new Error('Region sortOrder must be a non-negative integer');
    return this;
  }
}
