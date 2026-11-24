# Application Navigation & Layout Shell

## Overview
Renders the top application header, desktop navigation sidebar, and mobile touch-friendly bottom tab bar with notch-safe insets, farm selectors, role switchers, and quick action drawers.

## Interface
- `Navbar`: Responsive top bar featuring farm switcher, role dropdown, sync status, and quick AI shortcut (`Navbar.tsx`).
- `Sidebar`: Desktop navigation menu with entity counters for cattle, pregnancies, and active milkers (`Sidebar.tsx`).
- `MobileTabBar`: Mobile bottom bar providing 5 primary touch targets (Ganado, Preñez, (+) Acción, Ordeño, Más) and a comprehensive slide-up drawer (`MobileTabBar.tsx`).
- `AppTab`: Union type defining application navigation view states (`Sidebar.tsx`).

## Invariants
- On mobile screens (`< md`), the top `Navbar` displays only the farm selector, alerts bell, and AI button to prevent icon collision.
- The mobile tab bar conforms to safe area insets (`env(safe-area-inset-bottom)`).

## Side Effects
- Triggers navigation tab state changes and modal open events across the root application.

## Verification
- Run: `npm run build`
