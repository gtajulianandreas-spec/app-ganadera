# Financial Ledgers & Investor Portfolio Views

## Overview
Calculates unit economics (cost per liter of milk, cost per kg of beef, profit margins), breaks down operating expenses, and presents an executive portfolio view of herd capital valuation.

## Interface
- `FinancialDashboard`: Income/expense cash flow manager, category charts, and break-even analysis (`FinancialDashboard.tsx`).
- `InvestorPortfolioView`: Executive investor dashboard showing live livestock asset valuation, capital breakdown by age/purpose, and revenue return per hectare ($/Ha) (`InvestorPortfolioView.tsx`).

## Invariants
- Animal asset values are estimated based on prevailing market live weight ($/kg) and current life stage.
- Cash flows must categorize transactions into operational categories (`feed_supplement`, `veterinary_medicine`, `labor_payroll`, `milk_sale`, `animal_sale`).

## Side Effects
- Mutates `db.financialRecords` and enqueues sync actions in `db.syncOutbox`.

## Verification
- Run: `npm run build`
