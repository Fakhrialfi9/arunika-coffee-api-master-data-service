import { randomUUID } from 'node:crypto';

export interface CountryProps {
  uuid?: string;
  code: string;
  name: string;
  officialName?: string | null;
  shortName?: string | null;
  iso2: string;
  iso3: string;
  continent?: string | null;
  timezone?: string | null;
  phoneCode?: string | null;
  currency?: string | null;
  currencyCode?: string | null;
  isCoffeeOrigin?: boolean;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReconstituteCountryProps = CountryProps & {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
};

export class Country {
  private constructor(private readonly props: ReconstituteCountryProps) {}

  static create(props: CountryProps): Country {
    const now = new Date();
    return new Country({
      ...props,
      uuid: props.uuid ?? randomUUID(),
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
      isCoffeeOrigin: props.isCoffeeOrigin ?? false,
      isActive: props.isActive ?? true,
      sortOrder: props.sortOrder ?? 0,
    }).validate();
  }

  static reconstitute(props: ReconstituteCountryProps): Country {
    return new Country(props).validate();
  }
  get uuid(): string {
    return this.props.uuid;
  }
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get iso2(): string {
    return this.props.iso2;
  }
  get iso3(): string {
    return this.props.iso3;
  }
  get isActive(): boolean {
    return this.props.isActive ?? true;
  }
  get sortOrder(): number {
    return this.props.sortOrder ?? 0;
  }
  toPrimitives(): ReconstituteCountryProps {
    return {
      ...this.props,
      createdAt: new Date(this.props.createdAt),
      updatedAt: new Date(this.props.updatedAt),
    };
  }

  private validate(): Country {
    for (const [field, value] of [
      ['code', this.props.code],
      ['name', this.props.name],
      ['iso2', this.props.iso2],
      ['iso3', this.props.iso3],
    ] as const) {
      if (value.trim().length === 0 || value.length > 191)
        throw new Error(
          `Country ${field} must contain between 1 and 191 characters`,
        );
    }
    if (
      !Number.isInteger(this.props.sortOrder) ||
      (this.props.sortOrder ?? 0) < 0
    )
      throw new Error('Country sortOrder must be a non-negative integer');
    return this;
  }
}
