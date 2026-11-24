# Mobile Simulation & QA Test Harness

## Overview
Allows desktop evaluation of mobile hardware: wraps the UI in realistic physical smartphone frames (iPhone 15 Pro, Samsung Galaxy S24, Pixel 8, Tablet), simulates rural network disconnections, emulates RFID wand reads, and tests bulk data performance.

## Interface
- `MobileTesterDrawer`: QA drawer for toggling device frames, injecting mock batches of 25 cattle, simulating Bluetooth scale stabilization, and inspecting IndexedDB memory quotas (`MobileTesterDrawer.tsx`).
- `SimulatedDevice`: Union type representing viewport skins (`none`, `iphone15`, `galaxyS24`, `pixel8`, `tablet`).

## Invariants
- Simulated device frames must restrict container viewports to standard CSS device dimensions.
- Offline simulation overrides `syncEngine` status to `offline`.

## Side Effects
- Mutates `db.animals` when injecting bulk test cattle.
- Overrides network status flags within `SyncEngine`.

## Verification
- Run: `npm run build`
