# Multi-Farm Management Components

## Overview
Allows creation and configuration of multiple farms or ranches, specifying land area in hectares, primary production purpose, currency, default breed, and stage transitions.

## Interface
- `CreateFarmModal`: Modal dialogue for registering a new farm property (`CreateFarmModal.tsx`).

## Invariants
- Each created farm must have a unique UUID identifier and a defined primary purpose (`milk`, `beef`, `dual_purpose`, `mixed`).

## Side Effects
- Mutates `db.farms` and enqueues sync actions in `db.syncOutbox`.

## Verification
- Run: `npm run build`
