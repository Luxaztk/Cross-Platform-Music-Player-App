/**
 * Normalizes a string to NFC and trims it.
 * Used to fix common encoding issues where UTF-8 characters are misread.
 */
export function normalizeNFC(str: string): string {
  if (!str) return '';
  try {
    return str.normalize('NFC').trim();
  } catch {
    return str.trim();
  }
}
