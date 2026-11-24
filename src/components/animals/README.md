# Livestock Inventory & Individual Cow Management Components

## Overview
Provides visual lists, grid views, detailed medical/production histories, photo capturing, visual search matching, and life-stage transition configuration dialogs for cattle.

## Interface
- `AnimalList`: Main inventory table and photo grid with breed, gender, purpose filters and quick chip scanning (`AnimalList.tsx`).
- `AnimalDetailModal`: Modal dialog showing lifetime milestones, weight history, lactation records, and veterinary logs (`AnimalDetailModal.tsx`).
- `CreateAnimalModal`: Form for registering new animals with GPS capture, ear tag assignment, RFID scanning, and photo upload (`CreateAnimalModal.tsx`).
- `StageTransitionModal`: Configuration modal for customizing farm-level life-stage age thresholds (calf, weaned, juvenile, adult) (`StageTransitionModal.tsx`).
- `VisualSearchModal`: Camera-driven modal for identifying cattle by comparing camera photos against the visual gallery (`VisualSearchModal.tsx`).

## Invariants
- Ear tag code (`earTagCode`) is mandatory when creating an animal.
- Birth date changes must trigger stage recalculation suggestions via `StageTransitionEngine`.
- Modals must preserve parent scroll state and cleanly unmount media streams on close.

## Side Effects
- Mutates `db.animals`, `db.farms`, and `db.syncOutbox` via creation and update events.
- Accesses camera via `MediaDevices.getUserMedia` in visual search and photo upload workflows.

## Verification
- Run: `npm run build`
