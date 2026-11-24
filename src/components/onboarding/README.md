# Pilot Tester Welcome & Onboarding

## Overview
Introduces first-time ranchers and testers to the application, providing choices between exploring the pre-loaded demo herd or starting with an empty farm, alongside PWA installation instructions.

## Interface
- `WelcomePilotModal`: First-run onboarding modal presenting feature highlights and herd startup options (`WelcomePilotModal.tsx`).

## Invariants
- Persists user dismissal in `localStorage.setItem('has_seen_pilot_welcome', 'true')` to avoid re-prompting returning users.

## Side Effects
- Mutates `localStorage` and optionally clears database tables if starting with an empty farm.

## Verification
- Run: `npm run build`
