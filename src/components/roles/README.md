# Role-Based User Persona Banners

## Overview
Renders contextual, tailored action banners depending on the active user profile (Admin, Zootechnician, Investor, Veterinarian, Worker).

## Interface
- `RoleDashboardBanner`: Contextual header banner presenting specialized role shortcuts, withdrawal counters, and transition reminders (`RoleDashboardBanner.tsx`).

## Invariants
- Admin role renders no extra banner (standard full-access view).
- Displays actionable badges for active withdrawals (Veterinarian) and stage transition candidates (Zootechnician).

## Side Effects
- Invokes parent navigation callbacks (`onSelectTab`, `onOpenStageConfig`).

## Verification
- Run: `npm run build`
