import { describe, expect, it } from 'vitest';
import { compareVietnameseText } from '../string.js';

describe('compareVietnameseText', () => {
  it('should place the complete D group before the Đ group', () => {
    const titles = [
      'Đứng gọi anh là idol',
      'Đường Vào Tim Em',
      'Dưới Hiên Nhà',
      'Đường Xa Ướt Mưa',
      'Dẫu Có Lỗi Lầm',
    ];

    expect(titles.sort(compareVietnameseText)).toEqual([
      'Dẫu Có Lỗi Lầm',
      'Dưới Hiên Nhà',
      'Đứng gọi anh là idol',
      'Đường Vào Tim Em',
      'Đường Xa Ướt Mưa',
    ]);
  });

  it('should normalize composed and decomposed Vietnamese text consistently', () => {
    expect(compareVietnameseText('Đường', 'Đường')).toBe(0);
  });
});
