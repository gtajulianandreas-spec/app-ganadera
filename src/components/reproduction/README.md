# Reproduction & Breeding Management Dashboard

## Overview
Tracks artificial insemination, natural services, pregnancy palpation checks, calving projections, dry-off deadlines, and intramammary dry-cow therapy logging.

## Interface
- `ReproductionDashboard`: Comprehensive dashboard with pregnancy metrics, upcoming calving timelines, estrus monitoring, and dry-off therapy logger (`ReproductionDashboard.tsx`).

## Invariants
- Mandatory dry-off dates must be calculated at exactly 60 days prior to the projected calving date.
- Gestation calculations must respect species differences (*Bos taurus* vs *Bos indicus*).

## Side Effects
- Mutates `db.reproductionEvents` and enqueues sync actions to `db.syncOutbox`.

## Verification
- Run: `npm run build`
