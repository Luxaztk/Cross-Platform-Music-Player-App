import { describe, it, expect } from 'vitest';
import { extractThemeBackgroundColors } from '../../../../electron/utils/themeScssParser';
import fs from 'node:fs';
import path from 'node:path';

describe('themeScssParser', () => {
  it('should extract background colors from mock SCSS content', () => {
    const mockScss = `
      %theme-customdark-vars {
        --bg-primary: #123456;
        --color-primary: #ffffff;
      }
      %theme-customlight-vars {
        --bg-primary: #abcdef;
      }
    `;

    const colors = extractThemeBackgroundColors(mockScss);
    expect(colors).toEqual({
      customdark: '#123456',
      customlight: '#abcdef',
    });
  });

  it('should extract all 6 official themes directly from the real ThemeProvider.scss file', () => {
    const scssPath = path.resolve(__dirname, '../../../presentations/components/Theme/ThemeProvider.scss');
    const realScssContent = fs.readFileSync(scssPath, 'utf-8');

    const colors = extractThemeBackgroundColors(realScssContent);

    expect(colors).toHaveProperty('midnight', '#0a0a0a');
    expect(colors).toHaveProperty('amoled', '#000000');
    expect(colors).toHaveProperty('nord', '#2e3440');
    expect(colors).toHaveProperty('rose', '#1c1917');
    expect(colors).toHaveProperty('ocean', '#0f172a');
    expect(colors).toHaveProperty('snow', '#f9f8f7');
  });

  it('should return empty object for empty or unrelated SCSS content', () => {
    const emptyResult = extractThemeBackgroundColors('');
    expect(emptyResult).toEqual({});

    const unrelatedResult = extractThemeBackgroundColors('body { color: red; }');
    expect(unrelatedResult).toEqual({});
  });
});
