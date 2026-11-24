# Domain Calculation & Business Services

## Overview
Houses pure computational services, zootechnical formulas, financial KPI engines, geolocation geofencing, Excel import/export processing, and computer vision image comparison utilities.

## Interface
- `AiAssistantService`: Local RAG farm assistant and external agronomic advisory engine (`src/services/aiAssistant.ts`).
- `ExcelService`: Excel template generation, file parsing, and livestock spreadsheet export (`src/services/excelService.ts`).
- `FinancialEngine`: Cost per liter, cost per kg, break-even points, and herd valuation algorithms (`src/services/financialEngine.ts`).
- `GpsService`: HTML5 Geolocation capture, Haversine distance, and farm boundary geofencing (`src/services/gpsService.ts`).
- `ReproductionEngine`: Gestation calculations (*Bos taurus* 283d vs *Bos indicus* 292d), dry-off dates, and estrus intervals (`src/services/reproductionEngine.ts`).
- `StageTransitionEngine`: Age computation from birth dates and life-stage threshold recommendations (`src/services/stageTransitionEngine.ts`).
- `VisualSearchService`: Client-side image compression, RGB color histogram extraction, and Euclidean photo matching (`src/services/visualSearchService.ts`).
- `samplePhotos`: Offline SVG cattle representations for sample breeds (`src/services/samplePhotos.ts`).

## Invariants
- Computational algorithms must remain deterministic and resilient to incomplete historical records.
- Gestation calculations must differentiate between taurine and zebuine sub-species baseline durations.
- Image processing must downscale and compress images on the client side to avoid exceeding IndexedDB quota.

## Side Effects
- `GpsService` requests device GPS sensor permissions via `navigator.geolocation`.
- `VisualSearchService` allocates HTML5 `<canvas>` elements for pixel extraction.
- `ExcelService` triggers browser file download dialogues.

## Verification
- Run: `npm run build`
