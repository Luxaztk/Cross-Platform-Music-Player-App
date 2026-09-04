/**
 * MeloVista Homelab Master Ecosystem — PM2 Monorepo Configuration
 * Node: luxaztk-server (Ubuntu 26.04 LTS, Pentium N6000, 3.32GB RAM, 440GB Disk)
 * 
 * Manages both:
 * 1. melovista-stream-server: HTTP 206 Direct Streaming Server (Port 4545)
 * 2. melovista-discord-bot: Discord Music Bot & Activity Server (Port 36970 / 8080)
 */
module.exports = {
  apps: [
    {
      name: 'melovista-stream-server',
      cwd: './apps/server',
      script: 'src/index.ts',
      interpreter: 'node',
      node_args: '--import tsx',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      exp_backoff_restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
        PORT: 4545,
        HOST: '0.0.0.0',
        MUSIC_DIR: process.env.MUSIC_DIR || './data/music',
      },
    },
    {
      name: 'melovista-discord-bot',
      cwd: './apps/bot',
      script: 'src/index.ts',
      interpreter: 'node',
      node_args: '--import tsx',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '350M',
      exp_backoff_restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
        PORT: 36970,
      },
    },
  ],
};
