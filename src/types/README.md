# Core Domain Type Definitions

## Overview
Provides canonical TypeScript interfaces, type aliases, and constants that model the entire livestock management domain, database entities, synchronization protocol, and role permissions.

## Interface
- `Animal`, `Farm`, `Lot`, `Pasture`, `StageTransitionConfig`: Core entity models for herds, paddocks, and property bounds (`src/types/animal.ts`).
- `Species`, `Gender`, `LifeStage`, `AnimalPurpose`, `AnimalStatus`: Domain enumeration unions for livestock biological classification (`src/types/animal.ts`).
- `MilkingRecord`, `WeightRecord`, `HealthRecord`: Production and veterinary treatment records (`src/types/production.ts`).
- `ReproductionEvent`, `ReproductionEventType`, `InseminationMethod`: Breeding, pregnancy, and dry-off tracking models (`src/types/reproduction.ts`).
- `FinancialRecord`, `FinancialSummary`, `FinancialCategory`: Economic income and operational expense schemas (`src/types/finance.ts`).
- `SyncStatus`, `SyncOutboxAction`: Local-first outbox queues and peer synchronization structures (`src/types/sync.ts`).
- `UserRole`, `UserRoleInfo`, `USER_ROLES`: Role-based access and persona configurations (`src/types/userRole.ts`).
- `AiMessage`, `AiChatSession`: Structure for cattle advisory agent interactions (`src/types/ai.ts`).

## Invariants
- Animal identifiers (`Animal.id`) must conform to UUIDv7 format for monotonic chronological sorting.
- Ear tags (`Animal.earTagCode`) must be non-empty within a specific farm boundary.
- Biological life stages (`currentStage`) must strictly reflect chronological age and configured `StageTransitionConfig` thresholds.

## Side Effects
- None (pure type declarations and static constant lookup tables).

## Verification
- Run: `npm run build`
