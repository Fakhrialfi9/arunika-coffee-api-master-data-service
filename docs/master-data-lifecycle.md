# Master Data Lifecycle Semantics

## Common lifecycle fields

Master entities use `isActive`, `sortOrder`, `createdAt`, and `updatedAt` according to the database contract. There is no `deletedAt` contract in the Master Data schema, so soft-delete behavior must not be invented.

`isActive = false` means the master record remains persisted for historical/reference integrity but should not be selected as an active reference by application use cases unless an explicit administrative operation requires inactive data.

`sortOrder` is presentation/query ordering metadata and is not a relationship key.

## Processing methods and coffee grades

`coffee_beans.processingMethodId` is required. A referenced processing method being inactive does not make the historical CoffeeBean row invalid; application-level create/update flows should reject selecting an inactive method for new active inventory while preserving existing historical references.

`coffee_beans.gradeId` is optional. A referenced grade being inactive does not delete or orphan an existing CoffeeBean. New active quality assignments should use an active grade.

These rules are application/domain semantics; they are deliberately not encoded as a database FK condition because `isActive` is not a relational identity constraint.

## Harvest seasons

`harvest_seasons.isCurrent` expresses the current business season and is not protected by a database unique constraint. Application/domain logic must maintain singleton semantics: zero or one current season, and an inactive season must never be current.

`year` must be positive. `startMonth` and `endMonth` are nullable and, when present, must be in the range 1-12. When both are present, `startMonth <= endMonth`.

`coffee_beans.harvestSeasonId` is optional so historical or incomplete bean records can exist without inventing a mandatory season.

## Certifications

`certifications.requiresExpiration` describes whether a certification type normally requires expiry information at the business level. The database contract intentionally contains no `expirationDate` column and no FK from/to certification. Expiration handling must therefore remain outside the certification master schema until the database contract explicitly adds it.

Certifications are currently standalone master data and must not be associated with CoffeeBean, Farmer, Farm, or Organization through an invented FK.
