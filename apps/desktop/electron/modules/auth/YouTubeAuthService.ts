import { shell, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import log from 'electron-log/main';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * YouTubeAuthService - Phiên bản 2.0
 *
 * Chiến lược: Thay vì dùng Electron BrowserWindow (bị Google chặn),
 * ta mở YouTube trong trình duyệt HỆ THỐNG thật (Chrome/Edge/Firefox)
 * và dùng `yt-dlp --cookies-from-browser` để tự động trích xuất cookie
 * sau khi user đã đăng nhập.
 */

// Thứ tự ưu tiên trình duyệt để trích cookie
const BROWSER_PRIORITY = ['chrome', 'edge', 'brave', 'firefox', 'chromium'] as const;
type BrowserName = typeof BROWSER_PRIORITY[number];

export class YouTubeAuthService {
  private cookiesPath: string;
  private ytDlpPath: string;

  constructor() {
    this.cookiesPath = path.join(app.getPath('userData'), 'youtube_cookies.txt');
    this.ytDlpPath = this.resolveYtDlpPath();
    log.info(`[YouTubeAuth] yt-dlp resolved to: ${this.ytDlpPath}`);
  }

  /**
   * Dùng đúng logic path từ YoutubeDownloader để đảm bảo nhất quán.
   * - Packaged: process.resourcesPath/bin/yt-dlp.exe
   * - Dev: app.getAppPath()/resources/bin/yt-dlp.exe
   */
  private resolveYtDlpPath(): string {
    const isWin = process.platform === 'win32';
    const binaryName = isWin ? 'yt-dlp.exe' : 'yt-dlp';

    let resolvedPath: string;

    if (app.isPackaged) {
      resolvedPath = path.join(process.resourcesPath, 'bin', binaryName);
    } else {
      const path1 = path.join(app.getAppPath(), 'resources', 'bin', binaryName);
      const path2 = path.join(__dirname, '../../resources/bin', binaryName);
      resolvedPath = fs.existsSync(path1) ? path1 : path2;
    }

    // Đảm bảo không bị kẹt trong .asar
    if (resolvedPath.includes('app.asar') && !resolvedPath.includes('app.asar.unpacked')) {
      resolvedPath = resolvedPath.replace('app.asar', 'app.asar.unpacked');
    }

    return resolvedPath;
  }


  /**
   * Bước 1: Mở YouTube trong trình duyệt hệ thống thật
   * Trả về { opened: true } ngay lập tức.
   * UI hiển thị dialog hướng dẫn user đăng nhập xong rồi bấm "Tôi đã đăng nhập".
   */
  public async openAuthInSystemBrowser(): Promise<{ opened: boolean; error?: string }> {
    try {
      await shell.openExternal('https://www.youtube.com/');
      log.info('[YouTubeAuth] Opened YouTube in system browser for login.');
      return { opened: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log.error('[YouTubeAuth] Failed to open system browser:', msg);
      return { opened: false, error: msg };
    }
  }

  /**
   * Bước 2: Sau khi user xác nhận đã đăng nhập trong trình duyệt,
   * dùng yt-dlp để tự động tìm và trích xuất cookie từ trình duyệt đó.
   */
  public async extractCookiesFromBrowser(
    browserHint?: BrowserName
  ): Promise<{ success: boolean; browser?: string; error?: string; needManualImport?: boolean }> {
    const browsersToTry: BrowserName[] = browserHint
      ? [browserHint, ...BROWSER_PRIORITY.filter((b) => b !== browserHint)]
      : [...BROWSER_PRIORITY];

    for (const browser of browsersToTry) {
      log.info(`[YouTubeAuth] Trying to extract cookies from: ${browser}`);
      const result = await this.runYtDlpExtract(browser);

      if (result.success) {
        log.info(`[YouTubeAuth] Successfully extracted cookies from ${browser}. Saved to: ${this.cookiesPath}`);
        return { success: true, browser };
      }

      log.warn(`[YouTubeAuth] ${browser} failed: ${result.error}`);
    }

    return {
      success: false,
      error: 'Chrome/Edge sử dụng mã hoá App-Bound Encryption mới (Chrome 127+) khiến yt-dlp không thể tự động trích cookie. Vui lòng dùng phương thức Import File Cookie thủ công.',
      needManualImport: true,
    };
  }

  private runYtDlpExtract(browser: BrowserName): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // yt-dlp --cookies-from-browser <browser> --cookies <output_file>
      // Sử dụng một URL ngắn thật để force yt-dlp chạy và xuất cookie file
      const args = [
        '--cookies-from-browser', browser,
        '--cookies', this.cookiesPath,
        '--skip-download',
        '--quiet',
        '--no-warnings',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // URL cố định để test cookie
      ];

      log.info(`[YouTubeAuth] Spawning: ${this.ytDlpPath} ${args.join(' ')}`);

      const proc = spawn(this.ytDlpPath, args, { shell: false });

      let stderr = '';
      proc.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      const timeout = setTimeout(() => {
        proc.kill();
        resolve({ success: false, error: `Timeout khi trích cookie từ ${browser}` });
      }, 30_000);

      proc.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0 && fs.existsSync(this.cookiesPath)) {
          const content = fs.readFileSync(this.cookiesPath, 'utf-8');
          if (content.includes('.youtube.com') || content.includes('youtube')) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: `Cookie file không chứa dữ liệu YouTube (browser: ${browser})` });
          }
        } else {
          // Detect Chrome App-Bound Encryption error specifically
          const isDpapiError = stderr.includes('DPAPI') || stderr.includes('App-Bound') || stderr.includes('decrypt');
          const isLockedDb = stderr.includes('Could not copy') || stderr.includes('database is locked');
          let friendlyError = stderr || `yt-dlp exit code ${code} (browser: ${browser})`;
          if (isDpapiError) {
            friendlyError = `DPAPI_ERROR: ${browser} dùng App-Bound Encryption (Chrome 127+)`;
          } else if (isLockedDb) {
            friendlyError = `LOCKED_DB: ${browser} đang mở — hãy đóng trình duyệt rồi thử lại`;
          }
          resolve({ success: false, error: friendlyError });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ success: false, error: err.message });
      });
    });
  }

  /**
   * openAuthWindow() - Giữ nguyên API cũ để không phá vỡ IPC handler
   * Bây giờ nó sẽ mở system browser thay vì Electron BrowserWindow
   */
  public async openAuthWindow(): Promise<boolean> {
    const result = await this.openAuthInSystemBrowser();
    // Trả về false ở đây vì user cần thực hiện thêm bước xác nhận trên UI
    // (bấm nút "Đã đăng nhập" sau khi login trên browser)
    return result.opened;
  }

  public isLoggedIn(): boolean {
    if (!fs.existsSync(this.cookiesPath)) return false;
    try {
      const content = fs.readFileSync(this.cookiesPath, 'utf-8');
      return content.includes('.youtube.com') || content.includes('youtube');
    } catch {
      return false;
    }
  }

  /**
   * Import cookie từ file .txt do user xuất bằng browser extension.
   * Hỗ trợ định dạng Netscape (Get cookies.txt LOCALLY).
   */
  public async importCookiesFromFile(sourcePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const content = fs.readFileSync(sourcePath, 'utf-8');
      if (!content.includes('.youtube.com') && !content.includes('youtube')) {
        return { success: false, error: 'File không chứa cookie YouTube hợp lệ. Hãy dùng extension "Get cookies.txt LOCALLY" trên trang youtube.com.' };
      }
      fs.copyFileSync(sourcePath, this.cookiesPath);
      log.info(`[YouTubeAuth] Cookies imported from file: ${sourcePath} → ${this.cookiesPath}`);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`[YouTubeAuth] Failed to import cookies from file: ${msg}`);
      return { success: false, error: msg };
    }
  }

  public getCookiesPath(): string {
    return this.cookiesPath;
  }

  public logout(): void {
    if (fs.existsSync(this.cookiesPath)) {
      fs.unlinkSync(this.cookiesPath);
    }
    log.info('[YouTubeAuth] Logged out and removed cookies file.');
  }
}
