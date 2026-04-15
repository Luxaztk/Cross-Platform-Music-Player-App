import fs from 'node:fs/promises';
import { logger } from '@music/utils';

/**
 * Waits for a file to be unlocked by the OS/other processes.
 * Attempts to acquire a read/write handle (r+) to ensure extraction/injection is finished.
 * 
 * @param filePath Path to the file to check
 * @param maxRetries Maximum number of poll attempts
 * @param retryIntervalMs Delay between attempts in milliseconds
 */
export async function waitForFileUnlock(
  filePath: string,
  maxRetries = 50,
  retryIntervalMs = 100
): Promise<void> {
  logger.debug('[FileState] Waiting for OS lock release...', { filePath });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let fileHandle: fs.FileHandle | null = null;
    try {
      // Attempt to open in r+ mode (read/write), which requires exclusive access 
      // if another process (like FFmpeg) is still writing/holding it.
      fileHandle = await fs.open(filePath, 'r+');

      // CRITICAL: Successfully acquired handle - IMMEDIATELY close it to prevent FD leak
      await fileHandle.close();
      fileHandle = null;

      logger.info('[FileState] File unlocked, proceeding to import', { filePath, attempt });
      return;
    } catch (err: any) {
      // Catch lock-related errors: 
      // EBUSY: File is busy (Windows)
      // EPERM/EACCES: Permission denied (often happens during active locks)
      const isLocked = ['EBUSY', 'EPERM', 'EACCES'].includes(err.code);

      if (isLocked) {
        logger.warn('[FileState] File locked, retrying...', { attempt, filePath, code: err.code });
        
        // Ensure handle is closed if open failed mid-acquisition (though open usually doesn't return a handle on error)
        if (fileHandle) {
          await fileHandle.close();
        }

        // yield the event loop to prevent CPU thrashing
        await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
      } else {
        // Unrecoverable error (e.g. ENOENT - file doesn't exist)
        throw err;
      }
    }
  }

  throw new Error(`Timeout: File remains locked after ${maxRetries} attempts: ${filePath}`);
}
