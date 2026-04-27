import { describe, it, expect } from 'vitest';
import { textMatches } from '../../application/utils/searchUtils';

describe('Bắt Bug "Nơi" và "Nói"', () => {
  it('Phải tìm ra "Nơi pháo hoa" khi search "nơi"', () => {
    const result = textMatches('Nơi pháo hoa rực rỡ', 'nơi');
    expect(result).toBe(true);
  });

  it('TUYỆT ĐỐI KHÔNG match "nói" khi user gõ "nơi"', () => {
    const result1 = textMatches('Tháng tư là lời nói dối của em', 'nơi');
    const result2 = textMatches('Lời tạm biệt chưa nói', 'nơi');
    
    expect(result1).toBe(false);
    expect(result2).toBe(false);
  });
});
