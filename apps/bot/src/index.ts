import { Events } from 'discord.js';
import { BotClient } from './services/BotClient.js';
import { ActivityServer } from './server/ActivityServer.js';
import { onReady } from './events/ready.js';
import { onInteractionCreate } from './events/interactionCreate.js';

async function bootstrap() {
  console.log('---------------------------------------------------------');
  console.log('  🎵 KHỞI ĐỘNG MELOVISTA DISCORD MUSIC BOT & ACTIVITY SERVER');
  console.log('---------------------------------------------------------');

  try {
    const client = new BotClient();
    const activityServer = new ActivityServer(client);

    // Khởi chạy HTTP & WebSocket Server cho Discord Embedded Activity
    const activityPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 36970;
    await activityServer.start(activityPort).catch((err) => {
      console.warn('[ActivityServer] Không thể khởi chạy Web Server:', err);
    });

    client.once(Events.ClientReady, () => onReady(client));
    client.on(Events.InteractionCreate, (interaction) => onInteractionCreate(interaction, client));

    // Bắt các tín hiệu ngắt (SIGINT/SIGTERM) để hủy kết nối bot sạch sẽ khi reload code
    const handleShutdown = async (signal: string) => {
      console.log(`\n[MeloVista Bot] 🛑 Nhận tín hiệu ${signal}, đang hủy kết nối an toàn...`);
      await activityServer.stop();
      for (const manager of client.musicManagers.values()) {
        manager.destroy();
      }
      await client.destroy();
      process.exit(0);
    };

    process.once('SIGINT', () => handleShutdown('SIGINT'));
    process.once('SIGTERM', () => handleShutdown('SIGTERM'));

    // Bắt các ngoại lệ chưa xử lý để đảm bảo bot không bị crash đột ngột
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[MeloVista Bot] Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('[MeloVista Bot] Uncaught Exception:', error);
    });

    console.log('[MeloVista Bot] Đang kết nối tới Discord Gateway...');
    await client.login(client.config.token);
  } catch (error) {
    console.error('[MeloVista Bot] ❌ Lỗi nghiêm trọng khi khởi động Bot:', error);
    process.exit(1);
  }
}

bootstrap();
