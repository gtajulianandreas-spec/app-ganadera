# Livestock Health, Veterinary & Withdrawal Tracking

## Overview
Manages treatments, vaccinations, antiparasitics, exact dosages (`ml`, `cc`, `mg`), route of administration, and calculates mandatory withdrawal periods for milk and meat safety.

## Interface
- `HealthRecordsView`: Veterinary ledger, active withdrawal quarantine monitors, and treatment entry modal (`HealthRecordsView.tsx`).

## Invariants
- An animal under active withdrawal must generate an urgent quarantine alert for food safety.
- Expiration dates and batch numbers must be recorded for biological traceability.

## Side Effects
- Mutates `db.healthRecords` and enqueues sync actions in `db.syncOutbox`.
- Queries GPS location via `GpsService` when tagging treatment coordinates in the field.

## Verification
- Run: `npm run build`
