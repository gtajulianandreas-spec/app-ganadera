# Application Source Root

## Overview
Root source directory containing the application orchestrator (`App.tsx`), React DOM bootstrapper (`main.tsx`), PWA service worker manager (`pwa.ts`), and modular domain subsystems.

## Local Interface & Invariants
- `App`: Core application component managing active farm filtering, tab routing, modal dialog visibility, and simulated device skins (`App.tsx`).
- `pwaManager`: Singleton manager capturing `beforeinstallprompt` events and coordinating offline PWA installation (`pwa.ts`).
- `main.tsx`: StrictMode React DOM root mount.

## Subdirectories & Boundaries
- [components](./components/README.md) - Modular presentation components, modals, dashboards, and UI layouts.
- [db](./db/README.md) - Client-side IndexedDB persistence layer, backup serialization, and database seeders.
- [services](./services/README.md) - Computational engines, zootechnical formulas, GPS geofencing, and Excel parsers.
- [sync](./sync/README.md) - Transactional outbox synchronization engine and Last-Write-Wins conflict resolution.
- [types](./types/README.md) - Canonical domain models, database entity schemas, and TypeScript interfaces.

## Verification
- Run: `npm run build`
