/**
 * Script xóa toàn bộ Global Slash Commands khỏi Discord API.
 * Chạy một lần để dọn sạch commands đã đăng ký global trước đó.
 */
import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;

const rest = new REST({ version: '10' }).setToken(token);

console.log('[Cleanup] Đang xóa tất cả Global Commands...');

await rest.put(Routes.applicationCommands(clientId), { body: [] });

console.log('[Cleanup] ✅ Đã xóa tất cả Global Commands thành công!');
console.log('[Cleanup] Các Guild Commands (tức thì) vẫn còn hiệu lực.');
