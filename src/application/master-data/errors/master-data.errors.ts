export class MasterDataNotFoundError extends Error { constructor(message = 'Master data record not found') { super(message); this.name = 'MasterDataNotFoundError'; } }
export class MasterDataValidationError extends Error { constructor(message: string) { super(message); this.name = 'MasterDataValidationError'; } }
