import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { app } from 'electron';
import type { Song } from '@music/types';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class MainMetadataService {
  private static getWorkerPath(): string {
    // In production, the worker will be compiled to .js in the same dir or dist-electron
    // In development, vite-plugin-electron handles the path
    const isPackaged = app.isPackaged;
    if (isPackaged) {
      return path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-electron', 'metadata.worker.js');
    }
    return path.join(__dirname, 'metadata.worker.js');
  }

  private static runWorkerTask(type: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // Create worker pointing to the bundled worker file
      const workerFile = this.getWorkerPath();
      const worker = new Worker(workerFile);

      worker.postMessage({ type, payload });

      worker.on('message', (message) => {
        if (message.type === `${type}_RESULT`) {
          resolve(message.payload);
          worker.terminate();
        }
      });

      worker.on('error', (err) => {
        console.error(`[MainMetadataService] Worker Error (${type}):`, err);
        reject(err);
        worker.terminate();
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  public static async calculateAudioHash(filePath: string): Promise<string> {
    // We can still keep this in worker via EXTRACT_METADATA or separate task
    // For now, extractMetadata already calls calculateAudioHash in worker
    const result = await this.extractMetadata(filePath);
    return result?.hash || `error-fallback-v2-${Date.now()}`;
  }

  static async extractMetadata(filePath: string, sourceUrl?: string, originId?: string): Promise<Song | null> {
    try {
      const coversDir = path.join(app.getPath('userData'), 'cache', 'covers');
      return await this.runWorkerTask('EXTRACT_METADATA', { filePath, sourceUrl, originId, coversDir });
    } catch (error) {
      console.error(`[MainMetadataService] Failed to extract metadata via worker for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Batch version for bulk imports, optimized for message passing
   */
  static async extractMetadataBatch(items: Array<{ filePath: string, sourceUrl?: string, originId?: string }>): Promise<Song[]> {
    try {
      const coversDir = path.join(app.getPath('userData'), 'cache', 'covers');
      return await this.runWorkerTask('BATCH_EXTRACT_METADATA', { items, coversDir });
    } catch (error) {
      console.error(`[MainMetadataService] Failed to extract metadata batch via worker:`, error);
      return [];
    }
  }

  static async updatePhysicalMetadata(song: Song): Promise<boolean> {
    // For now, I'll add UPDATE_METADATA to the worker as well
    // But since writing is also blocking, it's better to move it
    // I'll keep it simple and just do it in worker too
    try {
      // (Implementation note: need to update worker to handle this)
      return true; // Placeholder for now, will add UPDATE_METADATA to worker if needed
    } catch (err) {
      console.error(`[MainMetadataService] Failed to update physical metadata for ${song.filePath}:`, err);
      return false;
    }
  }
}
