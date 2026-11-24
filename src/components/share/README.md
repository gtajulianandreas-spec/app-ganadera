# Pilot Sharing & WhatsApp Feedback Mechanism

## Overview
Facilitates peer evaluation by generating QR codes for 1-tap mobile installation, WhatsApp share links with pre-formatted invitation text, and a structured feedback generator capturing device diagnostics.

## Interface
- `ShareAndFeedbackModal`: Dialog featuring QR code generation, WhatsApp message launcher, and diagnostic feedback rating form (`ShareAndFeedbackModal.tsx`).

## Invariants
- Dynamic URLs must reflect the current window host (`window.location.href`).
- Diagnostic payloads include user agent, screen resolution, local animal count, and active farm.

## Side Effects
- Copies URLs to clipboard via `navigator.clipboard.writeText`.
- Opens WhatsApp Web or native WhatsApp client via `https://wa.me/?text=...`.

## Verification
- Run: `npm run build`
