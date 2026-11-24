/**
 * Generates collision-resistant, monotonically sortable or standard UUIDv4 identifiers.
 * Eradicates the deprecated String.prototype.substr() pattern.
 */
export function generateId(prefix: string = 'ent'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  // Fallback for older non-secure contexts
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${randomPart}`;
}
