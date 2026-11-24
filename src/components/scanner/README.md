# Universal Chip, RFID, NFC & Barcode Scanner

## Overview
Connects to mobile device sensors to read electronic ear tags, ruminal boluses, and visual tags using the Web NFC API (`window.NDEFReader`), camera-based Barcode Detection (`window.BarcodeDetector`), and external Bluetooth wand readers (Allflex, Gallagher, Tru-Test).

## Interface
- `UniversalChipScannerModal`: Multi-tab modal providing NFC tag reading, camera barcode/QR scanning, and manual/Bluetooth stick inputs (`UniversalChipScannerModal.tsx`).

## Invariants
- Audio beep and haptic feedback (`navigator.vibrate`) must trigger upon successful tag capture.
- Scanned serial IDs must be checked against `Animal.electronicId` and `Animal.earTagCode`.

## Side Effects
- Requests NFC hardware permissions on supported Android Chromium devices.
- Accesses camera stream via `navigator.mediaDevices.getUserMedia`.
- Synthesizes audio tones via Web Audio API (`AudioContext`).

## Verification
- Run: `npm run build`
