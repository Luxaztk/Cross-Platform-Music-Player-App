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

const VIETNAMESE_SORT_COLLATOR = new Intl.Collator('vi-VN', {
  usage: 'sort',
  sensitivity: 'variant',
  numeric: true,
});

export function compareVietnameseText(left: string, right: string): number {
  return VIETNAMESE_SORT_COLLATOR.compare(normalizeNFC(left), normalizeNFC(right));
}
