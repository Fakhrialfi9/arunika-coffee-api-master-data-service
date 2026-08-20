export abstract class RepositoryError extends Error {
  abstract readonly code: string;

  protected constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class RepositoryUniqueConstraintError extends RepositoryError {
  readonly code = 'REPOSITORY_UNIQUE_CONSTRAINT';

  constructor(
    public readonly fields: string[],
    cause?: unknown,
  ) {
    super(`Unique constraint violated for ${fields.join(', ')}`, { cause });
  }
}

export class RepositoryForeignKeyError extends RepositoryError {
  readonly code = 'REPOSITORY_FOREIGN_KEY_VIOLATION';

  constructor(
    public readonly fields: string[],
    cause?: unknown,
  ) {
    super(`Foreign key constraint violated for ${fields.join(', ')}`, {
      cause,
    });
  }
}

export class RepositoryNotFoundError extends RepositoryError {
  readonly code = 'REPOSITORY_NOT_FOUND';

  constructor(cause?: unknown) {
    super('Repository entity was not found', { cause });
  }
}

export class RepositoryBusinessRuleError extends RepositoryError {
  readonly code = 'REPOSITORY_BUSINESS_RULE_VIOLATION';

  constructor(
    public readonly rule: string,
    message: string,
    cause?: unknown,
  ) {
    super(message, { cause });
  }
}

export class RepositoryPersistenceError extends RepositoryError {
  readonly code = 'REPOSITORY_PERSISTENCE_FAILURE';

  constructor(cause?: unknown) {
    super('Repository persistence operation failed', { cause });
  }
}
