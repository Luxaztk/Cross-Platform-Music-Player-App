/**
 * Isomorphic Logger Utility
 * Handles logging across Main (Node), Renderer (Browser), and Preload contexts.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'verbose';

class Logger {
  private get isRenderer(): boolean {
    return typeof globalThis !== 'undefined' && 'window' in globalThis && typeof (globalThis as unknown as { window: { electronAPI: unknown } }).window.electronAPI !== 'undefined';
  }

  private get isMain(): boolean {
    return typeof process !== 'undefined' && (process as unknown as { type: string }).type === 'browser';
  }

  private async callLog(level: LogLevel, ...args: unknown[]) {
    const message = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
      .join(' ');

    if (this.isRenderer) {
      // Renderer Process: Send to Main via IPC bridge
      (globalThis as unknown as { window: { electronAPI: { log: (l: LogLevel, m: string) => void } } }).window.electronAPI.log(level, message);
    } else if (this.isMain) {
      // Main Process: Use injected logger from electron/main if available, fallback to console
      const electronLog = (globalThis as Record<string, unknown>).__electronLog;
      if (electronLog && typeof (electronLog as Record<string, (m: string) => void>)[level] === 'function') {
        (electronLog as Record<string, (m: string) => void>)[level](message);
      } else {
        console[level === 'debug' || level === 'verbose' ? 'log' : level](message);
      }
    } else {
      // Fallback (e.g. during build or tests)
      console[level === 'debug' || level === 'verbose' ? 'log' : level](message);
    }
  }

  info(...args: unknown[]) { this.callLog('info', ...args); }
  warn(...args: unknown[]) { this.callLog('warn', ...args); }
  error(...args: unknown[]) { this.callLog('error', ...args); }
  debug(...args: unknown[]) { this.callLog('debug', ...args); }
  verbose(...args: unknown[]) { this.callLog('verbose', ...args); }
}

export const logger = new Logger();
