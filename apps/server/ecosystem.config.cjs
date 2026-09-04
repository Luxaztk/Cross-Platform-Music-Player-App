/**
 * MeloVista Standalone Audio Streaming Server — PM2 Process Configuration
 * Node: luxaztk-server (Ubuntu 26.04 LTS, Pentium N6000, 3.32GB RAM)
 */
module.exports = {
  apps: [
    {
      name: 'melovista-stream-server',
      script: 'npm',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      exp_backoff_restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
        PORT: 4545,
        HOST: '0.0.0.0',
        MUSIC_DIR: process.env.MUSIC_DIR || '/home/luxaztk/Music',
      },
    },
  ],
};
