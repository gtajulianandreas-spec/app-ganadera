# Smart Livestock Alerts Center

## Overview
Aggregates critical operational notifications: pharmacological withdrawal periods (food safety), impending dry-off dates, projected calvings, and estrus cycles.

## Interface
- `SmartAlertsModal`: Unified alerts center modal with severity filtering (critical, warning, info) and 1-tap navigation to affected animal records (`SmartAlertsModal.tsx`).
- `SmartAlertItem`: Interface representing an actionable alert entity with title, description, category, and target tab (`SmartAlertsModal.tsx`).

## Invariants
- Pharmacological withdrawals are classified with `critical` severity.
- Impending dry-offs (< 15 days) are classified with `warning` severity.

## Side Effects
- Invokes parent navigation callback `onNavigateTab` to guide users to relevant module views.

## Verification
- Run: `npm run build`
