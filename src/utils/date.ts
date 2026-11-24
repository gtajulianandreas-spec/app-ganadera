/**
 * Standardized ISO and relative date utilities for farm management.
 */

/**
 * Returns current UTC/local day in ISO format: YYYY-MM-DD
 */
export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Adds or subtracts days from a given date string or today.
 * @param days Positive or negative integer of days to shift
 * @param fromDateStr Optional starting date in YYYY-MM-DD (defaults to today)
 */
export function addDays(days: number, fromDateStr?: string): string {
  const base = fromDateStr ? new Date(fromDateStr) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().split('T')[0];
}

/**
 * Checks if a given target date string is in the future or overdue relative to reference date.
 */
export function isOverdue(targetDateStr: string, referenceDateStr: string = getTodayStr()): boolean {
  return targetDateStr < referenceDateStr;
}
