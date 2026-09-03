/**
 * Trích xuất bảng màu nền --bg-primary trực tiếp từ ThemeProvider.scss.
 * Đảm bảo ThemeProvider.scss là Single Source of Truth duy nhất.
 */
export function extractThemeBackgroundColors(scssContent: string): Record<string, string> {
  const result: Record<string, string> = {};
  const blockRegex = /%theme-([a-z0-9_-]+)-vars\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(scssContent)) !== null) {
    const themeName = match[1];
    const blockContent = match[2];
    const bgMatch = /--bg-primary:\s*([#a-fA-F0-9]+)/.exec(blockContent);
    if (bgMatch) {
      result[themeName] = bgMatch[1].toLowerCase();
    }
  }

  return result;
}
