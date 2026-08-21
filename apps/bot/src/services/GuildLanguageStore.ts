import fs from 'node:fs';
import path from 'node:path';
import type { BotLanguage } from '@music/i18n';

export class GuildLanguageStore {
  private languages: Map<string, BotLanguage> = new Map();
  private filePath: string;
  private readonly inMemory: boolean;

  constructor(filePath?: string) {
    this.inMemory = filePath === ':memory:';
    this.filePath = this.inMemory
      ? ':memory:'
      : (filePath || path.resolve(process.cwd(), 'data/guild_settings.json'));
    if (!this.inMemory) {
      this.load();
    }
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          Object.entries(data).forEach(([guildId, lang]) => {
            if (lang === 'vi' || lang === 'en') {
              this.languages.set(guildId, lang as BotLanguage);
            }
          });
        }
      }
    } catch (err) {
      console.warn('[GuildLanguageStore] Failed to load guild settings:', err);
    }
  }

  private save(): void {
    if (this.inMemory) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const obj: Record<string, string> = {};
      this.languages.forEach((val, key) => {
        obj[key] = val;
      });
      fs.writeFileSync(this.filePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[GuildLanguageStore] Failed to save guild settings:', err);
    }
  }

  public getLanguage(guildId: string | null | undefined): BotLanguage {
    if (!guildId) return 'vi';
    return this.languages.get(guildId) || 'vi';
  }

  public setLanguage(guildId: string, lang: BotLanguage): void {
    this.languages.set(guildId, lang);
    this.save();
  }
}

export const guildLanguageStore = new GuildLanguageStore();
