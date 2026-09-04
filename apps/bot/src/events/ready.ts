import { REST, Routes } from 'discord.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { BotClient } from '../services/BotClient.js';
import { allCommands } from '../commands/index.js';

export async function onReady(client: BotClient) {
  console.log(`[MeloVista Bot] 🚀 Đăng nhập thành công với tài khoản: ${client.user?.tag}`);

  // Đăng ký Commands vào Map của Client
  for (const cmd of allCommands) {
    client.commands.set(cmd.data.name, cmd);
  }

  // Chuẩn bị payload đăng ký Slash Commands với Discord REST API
  const commandData = allCommands.map((cmd) => cmd.data.toJSON());

  // IMP-B8 FIX: So sánh mã SHA-256 hash của commands để không gọi REST PUT vô ích khi khởi động lại
  const currentHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(commandData) + (client.config.guildId || 'global'))
    .digest('hex');

  const dataDir = path.resolve(process.cwd(), 'data');
  const hashFilePath = path.join(dataDir, '.command_hash');

  try {
    if (fs.existsSync(hashFilePath)) {
      const savedHash = fs.readFileSync(hashFilePath, 'utf-8').trim();
      if (savedHash === currentHash) {
        console.log(`[MeloVista Bot] ⚡ Slash Commands (${commandData.length} lệnh) không thay đổi (hash khớp). Bỏ qua đăng ký REST API!`);
        return;
      }
    }
  } catch (err) {
    console.warn('[MeloVista Bot] Không thể đọc cache hash commands:', err);
  }

  const rest = new REST({ version: '10' }).setToken(client.config.token);

  try {
    if (client.config.guildId) {
      console.log(`[MeloVista Bot] Đang đồng bộ ${commandData.length} Slash Commands tới Guild ${client.config.guildId}...`);
      await rest.put(
        Routes.applicationGuildCommands(client.config.clientId, client.config.guildId),
        { body: commandData }
      );
      console.log(`[MeloVista Bot] ✅ Đã đăng ký thành công ${commandData.length} Slash Commands cho Guild (hiệu lực tức thì)!`);
    } else {
      console.log(`[MeloVista Bot] Đang đồng bộ ${commandData.length} Slash Commands toàn cầu (Global)...`);
      await rest.put(
        Routes.applicationCommands(client.config.clientId),
        { body: commandData }
      );
      console.log(`[MeloVista Bot] ✅ Đã đăng ký ${commandData.length} Slash Commands toàn cầu!`);
      console.log(`[MeloVista Bot] 💡 Mẹo: Điền GUILD_ID (Server ID) trong file apps/bot/.env để 10 lệnh cập nhật TỨC THÌ (< 1s) mà không bị Discord cache 1 giờ!`);
    }

    // Lưu hash mới sau khi đăng ký thành công
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(hashFilePath, currentHash, 'utf-8');
    } catch (saveErr) {
      console.warn('[MeloVista Bot] Không thể lưu cache hash commands:', saveErr);
    }
  } catch (error) {
    console.error('[MeloVista Bot] ❌ Lỗi khi đăng ký Slash Commands:', error);
  }
}
