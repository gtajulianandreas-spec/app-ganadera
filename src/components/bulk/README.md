# Bulk Excel & Livestock Spreadsheet Import

## Overview
Parses external spreadsheets (`.xlsx`), validates row schemas, maps columns to internal entities, provides live previews, and performs bulk transactions to import entire herds.

## Interface
- `BulkManagerModal`: Modal dialog for downloading templates, dragging/dropping Excel files, inspecting parsed rows, and confirming batch imports (`BulkManagerModal.tsx`).

## Invariants
- Each imported row must contain a valid `earTagCode` and valid `species` classification.
- Duplicate ear tags within the destination farm are flagged as validation errors prior to saving.

## Side Effects
- Reads uploaded file bytes via `FileReader`.
- Executes bulk insertions into `db.animals` and enqueues sync actions in `db.syncOutbox`.

## Verification
- Run: `npm run build`
