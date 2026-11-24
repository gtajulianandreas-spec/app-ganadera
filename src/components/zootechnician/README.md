# Zootechnician & Biological Efficiency Dashboard

## Overview
Provides technical zootechnical monitoring, Average Daily Gain (ADG / GDP) rankings, lactation curve decline rates post-peak, Body Condition Scoring (BCS 1 to 5), and pasture forage balance insights.

## Interface
- `ZootechnicianDashboard`: Analytical view rendering ADG top performers, low-gain alarms, lactation persistence curves, and nutritional supplementation recommendations (`ZootechnicianDashboard.tsx`).

## Invariants
- Animals with ADG under 400 g/day are flagged automatically for parasite checks.
- Ideal target Body Condition Score is evaluated in the 3.0 to 3.5 range for breeding and calving readiness.

## Side Effects
- Reads `db.animals`, `db.weightRecords`, and `db.milkingRecords` without persisting direct mutations.

## Verification
- Run: `npm run build`
