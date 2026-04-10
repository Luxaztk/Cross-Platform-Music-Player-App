/**
 * Chuẩn hóa đường dẫn Sắt đá (Bulletproof) cho thuật toán Hash:
 * 1. .normalize('NFC'): Ép tiếng Việt về 1 chuẩn byte duy nhất.
 * 2. .replace(/\\/g, '/'): Thống nhất dấu xẹt.
 * 3. .toLowerCase(): Triệt tiêu lỗi phân biệt hoa/thường của ổ đĩa (C: vs c:) trên Windows.
 */
export const normalizePathForHash = (p: string): string => {
  if (!p) return '';
  return p.normalize('NFC').replace(/\\/g, '/').toLowerCase();
};