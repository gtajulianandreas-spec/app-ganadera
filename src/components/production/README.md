# Milk & Weight Production Views

## Overview
Renders daily milking log entries (AM/PM shifts), fat/protein percentages, bulk tank collection records, scale weighing history, and Average Daily Gain (ADG / GDP) tracking charts.

## Interface
- `MilkRecordsView`: Daily milking ledger, herd milk production charts, and per-cow yield logger (`MilkRecordsView.tsx`).
- `WeightRecordsView`: Scale weighing journal, weight progression curves, and batch weight logger (`WeightRecordsView.tsx`).

## Invariants
- Milking records must enforce valid shift enumerations (`AM` or `PM`).
- Weight gains (GDP) must be computed relative to the immediate previous weighing event chronologically.

## Side Effects
- Mutates `db.milkingRecords`, `db.weightRecords`, and updates `currentWeightKg` on affected `Animal` records.
- Enqueues sync actions to `db.syncOutbox`.

## Verification
- Run: `npm run build`
