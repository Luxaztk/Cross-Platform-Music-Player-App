import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

// Tìm và nạp file .env từ nhiều vị trí tiềm năng (khi chạy từ root monorepo hoặc từ trong apps/bot)
const envCandidatePaths = [
  path.resolve(process.cwd(), 'apps/bot/.env.local'),
  path.resolve(process.cwd(), 'apps/bot/.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(import.meta.dirname, '../../.env.local'),
  path.resolve(import.meta.dirname, '../../.env'),
];

for (const envPath of envCandidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export interface BotConfig {
  token: string;
  clientId: string;
  guildId?: string;
  cookiesPath?: string;
  defaultVolume: number;
  maxQueueSize: number;
}

export function loadConfig(): BotConfig {
  const token = process.env.DISCORD_TOKEN?.trim();
  const clientId = process.env.CLIENT_ID?.trim();
  const guildId = process.env.GUILD_ID?.trim() || undefined;
  let cookiesPath = process.env.COOKIES_PATH?.trim() || undefined;

  if (!token) {
    throw new Error(
      '[MeloVista Bot Config Error] Thiếu DISCORD_TOKEN trong file .env! Vui lòng kiểm tra lại.'
    );
  }

  if (!clientId) {
    throw new Error(
      '[MeloVista Bot Config Error] Thiếu CLIENT_ID trong file .env! Vui lòng kiểm tra lại.'
    );
  }

  // Nếu có cấu hình cookiesPath, phân giải đường dẫn tuyệt đối
  if (cookiesPath) {
    if (!path.isAbsolute(cookiesPath)) {
      cookiesPath = path.resolve(process.cwd(), cookiesPath);
    }
    if (!fs.existsSync(cookiesPath)) {
      console.warn(`[MeloVista Bot] Cảnh báo: File cookies tại "${cookiesPath}" không tồn tại. Tiếp tục chạy không có cookies.`);
      cookiesPath = undefined;
    }
  }

  const defaultVolume = Math.min(
    150,
    Math.max(0, parseInt(process.env.DEFAULT_VOLUME || '100', 10) || 100)
  );

  const maxQueueSize = Math.max(
    10,
    parseInt(process.env.MAX_QUEUE_SIZE || '500', 10) || 500
  );

  return {
    token,
    clientId,
    guildId,
    cookiesPath,
    defaultVolume,
    maxQueueSize,
  };
}
