/**
 * Isomorphic Logger Utility
 * Handles logging across Main (Node), Renderer (Browser), and Preload contexts.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'verbose';

class Logger {
  private get isRenderer(): boolean {
    return typeof globalThis !== 'undefined' && 'window' in globalThis && typeof (globalThis as any).window.electronAPI !== 'undefined';
  }

  private get isMain(): boolean {
    return typeof process !== 'undefined' && (process as any).type === 'browser';
  }

  private async callLog(level: LogLevel, ...args: any[]) {
    const message = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
      .join(' ');

    if (this.isRenderer) {
      // Renderer Process: Send to Main via IPC bridge
      (globalThis as any).window.electronAPI.log(level, message);
    } else if (this.isMain) {
      // Main Process: Dynamic import to avoid bringing electron-log into browser bundles
      try {
        const log = (await import('electron-log')).default;
        (log as any)[level](message);
      } catch (err) {
        console[level === 'debug' || level === 'verbose' ? 'log' : level](message);
      }
    } else {
      // Fallback (e.g. during build or tests)
      console[level === 'debug' || level === 'verbose' ? 'log' : level](message);
    }
  }

  info(...args: any[]) { this.callLog('info', ...args); }
  warn(...args: any[]) { this.callLog('warn', ...args); }
  error(...args: any[]) { this.callLog('error', ...args); }
  debug(...args: any[]) { this.callLog('debug', ...args); }
  verbose(...args: any[]) { this.callLog('verbose', ...args); }
}

export const logger = new Logger();
