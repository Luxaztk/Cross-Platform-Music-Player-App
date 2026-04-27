import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { SyncHistoryEntry, SyncStats } from '@music/types';
import { v4 as uuidv4 } from 'uuid';

export class SyncHistoryService {
  private historyPath: string;
  private maxEntries = 20;

  constructor() {
    const userData = app.getPath('userData');
    this.historyPath = path.join(userData, 'sync-history.json');
  }

  async getHistory(): Promise<SyncHistoryEntry[]> {
    try {
      const data = await fs.readFile(this.historyPath, 'utf-8');
      return JSON.parse(data);
    } catch (_err) {
      return [];
    }
  }

  async logEvent(stats: SyncStats, details: string[]): Promise<void> {
    const history = await this.getHistory();

    const newEntry: SyncHistoryEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      stats,
      details
    };

    // Prepend and limit
    const updatedHistory = [newEntry, ...history].slice(0, this.maxEntries);

    await fs.writeFile(this.historyPath, JSON.stringify(updatedHistory, null, 2), 'utf-8');
  }

  async clearHistory(): Promise<void> {
    try {
      await fs.unlink(this.historyPath);
    } catch (_err) {
      // Ignore if file doesn't exist
    }
  }
}
